# encoding: UTF-8
require 'json'
require 'fileutils'
require 'digest/sha2'
require 'digest/md5'
require File.join(File.dirname(__FILE__),'portable_payloads')
require File.join(File.dirname(__FILE__),'cnc_library_layout')
require File.join(File.dirname(__FILE__),'material_library')
require File.join(File.dirname(__FILE__),'build_library')

module LVN
  module PhaoChiV305CornerLite
    PORTABLE_ROOT = File.join(File.dirname(__FILE__), 'portable_library')

    def self.portable_store
      File.join(ENV['APPDATA'] || Dir.home, 'LVNTools', 'LOFIHOME_Portable')
    end

    def self.portable_model_folder
      File.join(portable_store, 'models').tr('\\', '/')
    end

    # Ruby 1.8 on Windows uses ANSI filesystem paths. Keep disk names ASCII,
    # and keep the original Unicode label separately for UI and re-export.
    def self.portable_filename(name)
      name =~ /[^\x00-\x7f]/ ? 'model_' + Digest::SHA256.hexdigest(name)[0,16] + '.skp' : name
    end

    def self.portable_read(path, fallback)
      return fallback unless File.file?(path)
      JSON.parse(File.read(path, :encoding => 'UTF-8'))
    end

    def self.portable_write(path, value)
      FileUtils.mkdir_p(File.dirname(path))
      temp = path + '.tmp-' + Compat.unique_key(5)
      File.open(temp, 'wb') { |f| f.write(JSON.pretty_generate(value)) }
      File.rename(temp, path)
    ensure
      File.delete(temp) if temp && File.file?(temp)
    end

    def self.portable_sidecar(path)
      ['.png', '.jpg', '.jpeg'].each do |ext|
        sidecar = path.sub(/\.skp\z/i, ext)
        return sidecar if sidecar != path && File.file?(sidecar)
      end
      nil
    end

    def self.portable_install_blob(name, target)
      return if File.file?(target) # Keep edits on the receiving computer.
      portable_materialize_blob(name,target)
    end

    def self.portable_initialize
      loading_this_call=false
      return if @portable_ready || @portable_loading
      manifest_path = File.join(PORTABLE_ROOT, 'manifest.json')
      return unless File.file?(manifest_path)
      @portable_loading = true
      loading_this_call=true
      @portable_errors = []
      data = portable_read(manifest_path, {})
      raise 'Unsupported portable library' unless data['format'] == 'LOFIHOME_PORTABLE_1'
      state_path = File.join(portable_store, 'installed.json')
      state = portable_read(state_path, {})
      if data['build_library']
        Array(data['build_assets']).each do |id|
          begin
            next if state['build_asset:'+id]
            target=BuildLibrary.asset(id)
            portable_install_blob(id,target)
            BuildLibrary.checked_asset(id);state['build_asset:'+id]=true
          rescue StandardError=>error
            @portable_errors << "Khối cụm #{id}: #{error.message}"
          end
        end
        BuildLibrary.merge(data['build_library'],state)
      end
      if data['cnc_library_layout'] && !state['cnc_library_layout']
        layout=cnc_library_layout_validate(data['cnc_library_layout'])
        portable_write(cnc_library_layout_file,layout) unless File.file?(cnc_library_layout_file)
        state['cnc_library_layout']=true
      end
      profiles_path = File.join(ENV['APPDATA'] || Dir.home, 'LVNTools', 'PhaoChiV59', 'user_profiles.json')
      profiles = portable_read(profiles_path, [])
      cnc_path = File.join(ENV['APPDATA'] || Dir.home, 'LVNTools', 'LOFIHOME_CNC', 'presets.json')
      cnc = portable_read(cnc_path, {'format' => 'LOFIHOME_CNC_1', 'items' => []})
      profile_map = portable_read(external_profile_map_file, {})
      name_map_path = File.join(portable_store,'filenames.json')
      name_map = portable_read(name_map_path,{})
      existing_dynamic = {}
      dynamic_folder = File.join(ENV['APPDATA'] || Dir.home,'LVNTools','PhaoChiV59','dynamic_components').tr('\\','/')
      if File.directory?(dynamic_folder)
        scan_external_skp(dynamic_folder).each do |path|
          existing_dynamic[File.basename(path)+':'+Digest::SHA256.file(path).hexdigest] = path
        end
      end
      data.fetch('profiles', []).each do |p|
        key = 'profile:' + p.fetch('id').to_s
        next if state[key]
        profiles << p unless profiles.any? { |existing| existing['id'] == p['id'] }
        state[key] = true
      end
      data.fetch('cnc_presets', []).each do |p|
        key = 'cnc:' + p.fetch('id').to_s
        next if state[key]
        cnc['items'] << p unless cnc['items'].any? { |existing| existing['id'] == p['id'] }
        state[key] = true
      end
      data.fetch('models', []).each do |entry|
        begin
        id = entry.fetch('id')
        raise 'Invalid model identifier' unless id =~ /\A[0-9a-f]{64}\z/
        name = entry.fetch('filename')
        raise 'Invalid model filename' unless name =~ /\.skp\z/i && name !~ /[\\\/:*?"<>|\x00-\x1f]/ && name !~ /\A\./
        kind = entry.fetch('kind')
        raise 'Invalid model kind' unless ['external', 'dynamic'].include?(kind)
        base = kind == 'dynamic' ? File.join(ENV['APPDATA'] || Dir.home, 'LVNTools', 'PhaoChiV59', 'dynamic_components', 'portable') : portable_model_folder
        target = File.join(base, id[0,16], portable_filename(name)).tr('\\', '/')
        if kind == 'dynamic'
          [entry['blob'],entry['legacy_blob']].compact.each do |blob_name|
            previous = existing_dynamic[name+':'+blob_name.split('.').first]
            target = previous if previous
          end
        end
        key = 'model:' + id
        name_map[external_profile_key(target)] = name
        unless state[key]
          blob = entry.fetch('blob')
          portable_install_blob(blob, target)
          if entry['thumbnail']
            ext = File.extname(entry['thumbnail'])
            portable_install_blob(entry['thumbnail'], target.sub(/\.skp\z/i, ext))
          end
          if entry['profile'] && !profile_map[external_profile_key(target)]
            calibration = entry['profile'].dup
            calibration['path'] = target
            profile_map[external_profile_key(target)] = calibration
          end
          if entry['display_name'] && !entry['display_name'].empty?
            existing = Sketchup.read_default('LOFIHOME_LibraryNames', v31722_name_key(target), '').to_s
            Sketchup.write_default('LOFIHOME_LibraryNames', v31722_name_key(target), entry['display_name']) if existing.empty?
          end
          state[key] = true
        end
        rescue => error
          @portable_errors << "#{entry['filename']}: #{error.message}"
        end
      end
      portable_write(profiles_path, profiles)
      portable_write(cnc_path, cnc)
      portable_write(external_profile_map_file, profile_map)
      portable_write(name_map_path,name_map)
      portable_write(state_path, state)
      @portable_ready = @portable_errors.empty?
    ensure
      @portable_loading = false if loading_this_call
    end

    # A small streaming ZIP writer avoids requiring Python, PowerShell or a gem
    # on the receiving computer. UTF-8 names and CRCs are standard ZIP fields.
    class PortableZip
      def initialize(path)
        begin
          require 'zlib'
          @compress = true
        rescue LoadError
          @compress = false
          @crc_table = (0..255).map do |value|
            8.times { value = (value & 1)==1 ? (0xedb88320 ^ (value >> 1)) : (value >> 1) }
            value
          end
        end
        @file = File.open(path, 'wb')
        @entries = []
      end
      def crc32(chunk, previous)
        return Zlib.crc32(chunk,previous) if @compress
        crc = previous ^ 0xffffffff
        chunk.each_byte { |byte| crc = @crc_table[(crc ^ byte) & 255] ^ (crc >> 8) }
        crc ^ 0xffffffff
      end
      def add(name, path, content=nil, compress=true)
        raise 'Duplicate ZIP entry' if @entries.any? { |entry| entry[0] == name }
        raise 'ZIP path must be relative' if name =~ /\A[\\\/]/ || name.split('/').include?('..')
        offset = @file.pos
        raise 'RBZ exceeds 4 GB ZIP limit' if offset >= 0xffffffff
        # 0x800 = UTF-8, 8 = data descriptor. Raw DEFLATE is ZIP method 8.
        flags = 0x808
        method = @compress && compress ? 8 : 0
        @file.write([0x04034b50,20,flags,method,0,33,0,0,0,name.bytesize,0].pack('VvvvvvVVVvv'))
        @file.write(name)
        compressor = method==8 ? Zlib::Deflate.new(6, -Zlib::MAX_WBITS) : nil
        crc = 0; size = 0; compressed = 0
        input = path ? File.open(path, 'rb') : nil
        begin
          loop do
            chunk = input ? input.read(1024*1024) : content
            break unless chunk
            crc = crc32(chunk, crc); size += chunk.bytesize
            output = compressor ? compressor.deflate(chunk) : chunk
            @file.write(output); compressed += output.bytesize
            break unless input
          end
          output = compressor ? compressor.finish : ''
          @file.write(output); compressed += output.bytesize
        ensure
          input.close if input
          compressor.close if compressor
        end
        raise 'RBZ file exceeds ZIP size limit' if [size,compressed].max >= 0xffffffff
        @file.write([0x08074b50,crc,compressed,size].pack('VVVV'))
        @entries << [name,flags,crc,compressed,size,offset,method]
      end
      def close
        offset = @file.pos
        raise 'RBZ exceeds ZIP limits' if @entries.length >= 65535 || offset >= 0xffffffff
        @entries.each do |name,flags,crc,compressed,size,start,method|
          @file.write([0x02014b50,20,20,flags,method,0,33,crc,compressed,size,name.bytesize,0,0,0,0,0,start].pack('VvvvvvvVVVvvvvvVV'))
          @file.write(name)
        end
        length = @file.pos-offset
        @file.write([0x06054b50,0,0,@entries.length,@entries.length,length,offset,0].pack('VvvvvVVv'))
        @file.close
      end
      def abort
        @file.close unless @file.closed?
      end
    end

    def self.portable_snapshot
      portable_initialize
      raise 'Thư viện còn mục chưa nạp được. Hãy cài lại gói đầy đủ trước khi xuất RBZ.' unless Array(@portable_errors).empty?
      blobs = {}; models = {}; map = load_external_profile_map
      name_map = portable_read(File.join(portable_store,'filenames.json'),{})
      add_blob = lambda do |path|
        hash = Digest::SHA256.file(path).hexdigest
        key = hash + File.extname(path).downcase
        blobs[key] = path
        key
      end
      roots = [EXTERNAL_MODEL_LIBRARY, saved_external_folder, portable_model_folder].compact.uniq.map { |p| ['external',p] }
      roots << ['dynamic',dc_library_folder]
      roots.each do |kind,folder|
        scan_external_skp(folder).each do |path|
          blob = add_blob.call(path)
          filename = name_map[external_profile_key(path)] || File.basename(path)
          id = Digest::SHA256.hexdigest(kind + ':' + blob + ':' + filename)
          entry = {'id'=>id,'kind'=>kind,'filename'=>filename,'blob'=>blob}
          entry['display_name'] = v31722_sample_name(path)
          entry['profile'] = map[external_profile_key(path)]
          if entry['profile']
            entry['profile'] = entry['profile'].dup
            entry['profile'].delete('path')
          end
          thumb = portable_sidecar(path)
          if !thumb && kind == 'external'
            candidate = external_thumb_path(path)
            thumb = candidate if File.file?(candidate)
          elsif !thumb && kind == 'dynamic'
            candidate = dc_thumbnail_path(path)
            thumb = candidate if File.file?(candidate)
          end
          entry['thumbnail'] = add_blob.call(thumb) if thumb
          # Preserve earlier-host alternatives already included in this build.
          @portable_export_seed ||= portable_read(File.join(PORTABLE_ROOT,'manifest.json'),{}).fetch('models',[])
          previous = @portable_export_seed.find { |p| p['id']==id || (p['kind']==kind && p['filename']==filename && [p['blob'],p['legacy_blob']].include?(blob)) }
          if previous
            ['blob','legacy_blob'].each do |key|
              next unless previous[key]
              source = portable_blob(previous[key])
              blobs[previous[key]] = source
              entry[key] = previous[key]
            end
            entry['id'] = previous['id']
          end
          existing = models[entry['id']]
          if existing
            entry['profile'] ||= existing['profile']
            entry['thumbnail'] ||= existing['thumbnail']
            entry['display_name'] = existing['display_name'] if entry['display_name']==File.basename(filename,'.skp')
          end
          models[entry['id']] = entry
        end
      end
      previews = {}
      models.values.each { |entry| previews[entry['blob']] = entry['thumbnail'] if entry['thumbnail'] }
      models.values.each { |entry| entry['thumbnail'] ||= previews[entry['blob']] }
      profiles = portable_read(USER_LIBRARY, [])
      data = {'format'=>'LOFIHOME_PORTABLE_1','created_at'=>Time.now.to_i,'profiles'=>profiles,'cnc_presets'=>cnc_presets,'models'=>models.values.sort_by { |m| m['id'] }}
      data['cnc_library_layout']=cnc_library_layout
      data['build_library'],data['build_assets']=BuildLibrary.snapshot(blobs)
      [data,blobs]
    end

    def self.portable_export(path)
      Licensing.validate_export(File.dirname(__FILE__))
      material_library_verify_export
      data,blobs = portable_snapshot
      root = File.dirname(__FILE__)
      prefix = File.basename(root)
      destination = File.expand_path(path)
      raise 'Hãy chọn nơi lưu bên ngoài thư mục plugin.' if destination.downcase.index(File.expand_path(root).downcase+'/') == 0
      temporary = destination + '.tmp-' + Compat.unique_key(5)
      payload_temp = temporary + '.data'
      zip = PortableZip.new(temporary)
      begin
        zip.add(prefix+'.rb', File.join(File.dirname(root),prefix+'.rb'))
        Dir.glob(File.join(root,'**','*')).sort.each do |source|
          next unless File.file?(source)
          relative = source[root.length+1..-1].tr('\\','/')
          next if relative=='update_patch.json'
          next if relative.index('portable_library/')==0
          # Historical native CNC files left by older installers are not loaded.
          next if relative.index('cnc_native/')==0 || ['cnc_native_bridge.rb','cnc_native_embed.rb'].include?(relative)
          zip.add(prefix+'/'+relative,source)
        end
        payload_index=portable_build_payload_pack(blobs,payload_temp)
        zip.add(prefix+'/portable_library/library.dat',payload_temp,nil,false)
        zip.add(prefix+'/portable_library/payload_index.json',nil,JSON.pretty_generate(payload_index))
        zip.add(prefix+'/portable_library/manifest.json',nil,JSON.pretty_generate(data))
        zip.close
        File.rename(temporary,destination)
      ensure
        zip.abort
        File.delete(temporary) if File.file?(temporary)
        File.delete(payload_temp) if File.file?(payload_temp)
      end
      data
    end

    def self.portable_export_dialog
      path = UI.savepanel('Đóng gói LOFIHOME kèm toàn bộ thư viện',nil,'LOFIHOME_V317_198_SU2021_PLUS_NHOM_ZALO.rbz')
      return unless path
      path += '.rbz' unless File.extname(path).downcase == '.rbz'
      Sketchup.set_status_text('LOFIHOME: Đang đóng gói chức năng và thư viện. Vui lòng chờ...')
      data = portable_export(path)
      UI.messagebox("Đã đóng gói RBZ kèm thư viện.\n#{data['profiles'].length} biên dạng, #{data['models'].length} mẫu SKP/Dynamic, #{data['cnc_presets'].length} cấu hình CNC, #{material_library_catalog.length} vật liệu.\n\n#{path}\n\nCài file này trên máy khác có SketchUp 2021+ để có sẵn thư viện. Sau khi lưu thêm mẫu, hãy xuất lại RBZ để mang theo dữ liệu mới nhất.")
    rescue => e
      UI.messagebox('Không đóng gói được thư viện: ' + e.message)
    ensure
      Sketchup.set_status_text('LOFIHOME')
    end
  end
end
