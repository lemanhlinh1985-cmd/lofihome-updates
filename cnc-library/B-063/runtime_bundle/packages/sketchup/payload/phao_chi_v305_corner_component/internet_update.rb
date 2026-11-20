# encoding: UTF-8
require 'uri'
require 'securerandom'
require 'thread'
require File.join(File.dirname(__FILE__),'update_archive')
module LVN
  module PhaoChiV305CornerLite
    module InternetUpdate
      extend self
      VERSION=File.read(File.join(File.dirname(__dir__),'phao_chi_v305_corner_component.rb'))[/ext\.version\s*=\s*'V([0-9.]+)-SU2021-PLUS'/,1].freeze
      def store
        File.join(ENV['APPDATA'] || Dir.home,'LVNTools','LOFIHOME_Update')
      end
      def https(value,base=nil)
        raise 'Nhập đường dẫn HTTPS của latest.json.' unless value.is_a?(String) && value.bytesize.between?(1,2048) && value !~ /[\s\\\x00-\x1f]/
        uri=base ? URI.join(base,value) : URI.parse(value)
        raise 'Đường dẫn cập nhật phải dùng HTTPS, không kèm mật khẩu.' unless uri.is_a?(URI::HTTPS) && uri.host && !uri.host.empty? && !uri.userinfo && !uri.fragment
        uri
      rescue URI::Error
        raise 'Đường dẫn cập nhật không hợp lệ.'
      end
      def version(value)
        raise 'Phiên bản không hợp lệ.' unless value.is_a?(String) && value.match?(/\A\d{1,4}\.\d{1,5}(?:\.\d{1,5})?\z/)
        value.split('.').map(&:to_i).fill(0,value.split('.').length...3)
      end
      def source_url
        path=File.join(store,'settings.json')
        data=JSON.parse(File.read(File.file?(path) ? path : File.join(__dir__,'update_channel.json')))
        data.fetch('manifest_url','')
      rescue => e
        raise 'Không đọc được địa chỉ cập nhật: '+e.message
      end
      def save_source(url)
        https(url);FileUtils.mkdir_p(store)
        path=File.join(store,'settings.json');tmp=path+'.tmp-'+SecureRandom.hex(4)
        File.write(tmp,JSON.generate({format:'LOFIHOME_UPDATE_CHANNEL_1',manifest_url:url}))
        File.rename(tmp,path)
      ensure
        File.delete(tmp) if tmp && File.file?(tmp)
      end
      def manifest(text,source,host=Sketchup.version.to_i)
        raise 'Thông tin cập nhật quá lớn.' if text.bytesize>65536
        data=JSON.parse(text)
        raise 'Thông tin bản cập nhật LOFIHOME không hợp lệ.' unless data.is_a?(Hash) && data['format']=='LOFIHOME_UPDATE_1' && data['product']=='LOFIHOME'
        minimum=data['sketchup_min_major']
        raise 'Bản cập nhật không phù hợp với phiên bản SketchUp đang dùng.' unless minimum==PhaoChiV305CornerLiteHost::MINIMUM_MAJOR && !data.key?('sketchup_major') && host>=minimum
        version(data['version'])
        raise 'Thiếu mã kiểm tra hoặc kích thước RBZ.' unless data['sha256'].is_a?(String) && data['sha256'].match?(/\A[0-9a-f]{64}\z/) && data['bytes'].is_a?(Integer) && data['bytes'].between?(22,UpdateArchive::MAX_BYTES)
        raise 'Ghi chú phiên bản không hợp lệ.' unless data.fetch('notes','').is_a?(String) && data.fetch('notes','').bytesize<=12000
        if data['quick']
          q=data['quick']
          raise 'Thông tin cập nhật nhanh không hợp lệ.' unless q.is_a?(Hash) && q.keys.sort==%w[bytes sha256 url] && q['bytes'].is_a?(Integer) && q['bytes'].between?(22,100_000_000) && q['sha256'].is_a?(String) && q['sha256'].match?(/\A[0-9a-f]{64}\z/)
          data['quick']=q.merge('url'=>https(q['url'],source).to_s)
        end
        data.merge('url'=>https(data['url'],source).to_s,'source'=>source)
      rescue JSON::ParserError
        raise 'Đường dẫn phải trả về latest.json, không phải trang chia sẻ/tải có đăng nhập.'
      end
      # A Ruby worker performs networking and disk I/O only. All SketchUp/UI API
      # calls stay in the timer/callback on the main thread. Stream large RBZs.
      def transfer(url,sink,limit,cancel,progress,expected=nil)
        require 'net/http'
        require 'openssl'
        uri=https(url);deadline=Process.clock_gettime(Process::CLOCK_MONOTONIC)+3600
        6.times do |redirect|
          raise 'Đã hủy.' if cancel.call
          http=Net::HTTP.new(uri.host,uri.port);http.use_ssl=true
          http.verify_mode=OpenSSL::SSL::VERIFY_PEER;http.open_timeout=15;http.read_timeout=30
          # SketchUp 2023's OpenSSL default points at the original build machine.
          # Supply a maintained Mozilla CA bundle; never disable peer/host checks.
          ca=ENV['SSL_CERT_FILE'].to_s
          ca=File.join(__dir__,'update_cacert.pem') if ca.empty?
          raise 'Thiếu bộ chứng chỉ HTTPS. Cài lại gói LOFIHOME đầy đủ.' unless File.file?(ca)
          http.ca_file=ca
          http.max_retries=0 if http.respond_to?(:max_retries=)
          next_uri=nil
          http.start do |connection|
            request=Net::HTTP::Get.new(uri.request_uri,{'Accept-Encoding'=>'identity','User-Agent'=>'LOFIHOME-Updater/'+VERSION,'Cache-Control'=>'no-cache'})
            connection.request(request) do |response|
              if [301,302,303,307,308].include?(response.code.to_i)
                raise 'Chuyển hướng quá nhiều lần.' if redirect==5
                next_uri=https(response['location'],uri.to_s)
                # Net::HTTP otherwise buffers an unread redirect body. Bound it
                # as well, even while checking the small latest.json manifest.
                redirect_bytes=0
                response.read_body do |chunk|
                  raise 'Đã hủy.' if cancel.call
                  redirect_bytes+=chunk.bytesize
                  raise 'Phản hồi chuyển hướng quá lớn.' if redirect_bytes>65536
                end
              else
                raise 'Máy chủ trả về HTTP '+response.code unless response.code=='200'
                declared=response['content-length']
                if declared
                  raise 'Kích thước tải không hợp lệ.' unless declared.match?(/\A\d+\z/) && declared.to_i<=limit && (!expected || declared.to_i==expected)
                end
                count=0
                response.read_body do |chunk|
                  raise 'Đã hủy.' if cancel.call
                  raise 'Tải quá thời gian cho phép. Kiểm tra mạng và thử lại.' if Process.clock_gettime(Process::CLOCK_MONOTONIC)>deadline
                  count+=chunk.bytesize;raise 'Dữ liệu tải vượt kích thước cho phép.' if count>limit
                  sink.write(chunk);progress.call(count,expected || (declared && declared.to_i))
                end
                raise 'Gói tải chưa đầy đủ.' if expected && count!=expected
                return uri.to_s
              end
            end
          end
          uri=next_uri
        end
        raise 'Không tải được dữ liệu cập nhật.'
      end
      # GitHub redirects each asset to a different signed CDN URL. A relative
      # RBZ filename cannot be resolved against the final manifest CDN URL.
      # Pin the asset to its version tag; keep ordinary HTTPS-folder exports.
      def github_release_root
        source=source_url.to_s
        return nil if source.empty?
        uri=https(source)
        match=uri.path.match(%r{\A/([A-Za-z0-9-]+)/([A-Za-z0-9_.-]+)/releases/latest/download/latest\.json\z})
        return nil unless uri.host.downcase=='github.com' && uri.port==443 && !uri.query && match
        'https://github.com/'+match[1]+'/'+match[2]+'/releases/download/'
      end
      def release_asset_url(filename,release_version=VERSION)
        version(release_version)
        name=URI::DEFAULT_PARSER.escape(File.basename(filename),/[^A-Za-z0-9._~-]/)
        base=github_release_root
        base ? base+'v'+release_version+'/'+name : name
      end
      def release_manifest(path,notes='')
        entries=UpdateArchive.inspect_file(path,VERSION)
        {format:'LOFIHOME_UPDATE_1',product:'LOFIHOME',version:VERSION,sketchup_min_major:PhaoChiV305CornerLiteHost::MINIMUM_MAJOR,
         url:release_asset_url(path),bytes:File.size(path),sha256:Digest::SHA256.file(path).hexdigest,notes:notes}
      end
      class Controller
        attr_reader :state,:job
        def initialize(dialog)
          @dialog=dialog;@client=nil;@sequence=0;@revision=0;@closed=false;@restart=!!InternetUpdate.instance_variable_get(:@restart_required);@available=nil
          source=InternetUpdate.source_url
          @state={phase:'idle',message:source.empty? ? 'Nhập địa chỉ cập nhật khi có máy chủ.' : 'Sẵn sàng kiểm tra phiên bản mới.',version:VERSION,url:source}
          @state.merge!(phase:'restart',message:'Đã cài bản mới. Lưu bản vẽ và mở lại SketchUp.') if @restart
        end
        def send_state
          return if @closed
          @revision+=1
          @dialog.execute_script('LofiUpdate.receive('+JSON.generate(@state.merge(client:@client,sequence:@sequence,revision:@revision))+');')
        end
        def active?;@job && @job[:thread] && @job[:thread].alive?;end
        def cancel
          @job[:cancel]=true if @job
          @available=nil
        end
        def close;@closed=true;cancel;end
        def set_state(phase,message,more={})
          @state=@state.merge({phase:phase,message:message,release:nil,progress:nil}).merge(more);send_state
        end
        def work(phase,message,&block)
          raise 'Đang xử lý yêu cầu trước.' if @job
          set_state(phase,message)
          job={cancel:false,progress:nil,result:nil,error:nil};@job=job
          job[:thread]=Thread.new do
            begin
              job[:result]=block.call(job)
            rescue StandardError, LoadError => error
              job[:error]=error.message
            end
          end
          @timer=UI.start_timer(0.25,true) { poll }
        end
        def poll
          job=@job;return unless job
          if job[:thread].alive?
            @state[:message]=job[:message] if job[:message]
            if job[:progress]
              @state[:progress]=job[:progress];send_state
            end
            return
          end
          UI.stop_timer(@timer);@timer=nil;@job=nil
          if @closed || job[:cancel]
            set_state('idle','Đã hủy. Bản đang dùng được giữ nguyên.') unless @closed
          elsif job[:error]
            set_state('error',job[:error])
          elsif job[:result][:kind]==:check
            @available=job[:result][:data]
            if (InternetUpdate.version(@available['version']) <=> InternetUpdate.version(VERSION))==1
              set_state('available','Có bản mới. Xem thông tin rồi bấm Tải và cập nhật.',release:@available)
            else
              @available=nil;set_state('current','Anh đang dùng bản bằng hoặc mới hơn bản trên máy chủ.')
            end
          else
            install(job)
          end
        rescue => error
          set_state('error',error.message)
        ensure
          # Retain successful downloads and backups for manual recovery. Partial
          # downloads are removed; paths are exclusively this updater's job files.
          if job && !job[:thread].alive? && job[:directory] && (job[:cancel] || job[:error])
            ['package.part','package.rbz'].each do |name|
              p=File.join(job[:directory],name);File.delete(p) if File.file?(p)
            end
          end
        end
        def install(job)
          raise 'Cần SketchUp 2021 trở lên.' unless PhaoChiV305CornerLiteHost.supported?
          raise 'Địa chỉ cập nhật đã thay đổi. Kiểm tra lại.' unless @available && @available==job[:result][:data] && InternetUpdate.source_url==@available['source']
          set_state('installing','Đang sao lưu và cài bản mới. Vui lòng chờ…')
          path=job[:result][:path]
          expected_hash=job[:result][:quick] ? @available.fetch('quick').fetch('sha256') : @available['sha256']
          raise 'Gói đã thay đổi sau khi tải.' unless Digest::SHA256.file(path).hexdigest==expected_hash
          root=File.expand_path('..',__dir__)
          expected=Sketchup.find_support_file('Plugins')
          raise 'Plugin không nằm trong thư mục Plugins đang dùng. Cài RBZ qua Extension Manager.' unless expected && File.realpath(expected).downcase==File.realpath(root).downcase
          if job[:result][:quick]
            # Recheck unchanged base files immediately before the host writes.
            UpdateArchive.inspect_file(path,@available['version'],lambda {false},lambda {|_,_|},root,@available['sha256'])
          end
          UpdateArchive.install(path,job[:result][:entries],root,File.join(job[:directory],'backup')) { |rbz| Sketchup.install_from_archive(rbz,true) }
          @restart=true;InternetUpdate.instance_variable_set(:@restart_required,true);@available=nil
          set_state('restart','Đã cài bản mới. Lưu bản vẽ, đóng rồi mở lại SketchUp để sử dụng. Thư viện riêng được giữ lại.')
        end
        def action(raw)
          return if @closed
          data=JSON.parse(raw);return unless data.is_a?(Hash)
          if data['action']=='ready'
            return unless data['client'].is_a?(String) && data['client'].match?(/\A[a-zA-Z0-9_-]{8,100}\z/)
            if @client!=data['client']
              cancel if @client
              @sequence=0;@client=data['client']
              @state=@state.merge(phase:'idle',release:nil,message:'Kiểm tra lại bản mới.') if !@job && !@restart
            end
            send_state;return
          end
          return unless data['client']==@client && data['sequence'].is_a?(Integer) && data['sequence']>@sequence
          @sequence=data['sequence']
          return send_state if @restart || @state[:phase]=='installing'
          if data['action']=='cancel'
            cancel
            set_state('cancelling','Đang hủy lượt tải…') if @job
            set_state('idle','Đã hủy. Bản đang dùng được giữ nguyên.') unless @job
          elsif data['action']=='check'
            return send_state if @job
            url=InternetUpdate.https(data['url'].to_s.strip).to_s;InternetUpdate.save_source(url)
            @available=nil;@state[:url]=url
            host=Sketchup.version.to_i
            work('checking','Đang kiểm tra bản mới…') do |job|
              require 'stringio';buffer=StringIO.new(''.b)
              final_url=InternetUpdate.transfer(url,buffer,65536,lambda { job[:cancel] },lambda { |a,b| job[:progress]=[a,b] })
              parsed=InternetUpdate.manifest(buffer.string,final_url,host).merge('source'=>url)
              {kind: :check,data:parsed}
            end
          elsif data['action']=='update'
            return send_state if @job
            raise 'Kiểm tra lại bản mới trước khi cập nhật.' unless @available && @state[:phase]=='available' && data['url']==@available['source'] && data['version']==@available['version']
            release=@available.dup
            repair=data['full']==true
            raise 'Chưa có gói cập nhật nhỏ. Bản đang dùng được giữ nguyên.' unless release['quick'] || repair
            work('downloading',repair ? 'Đang tải gói đầy đủ để sửa thư viện…' : 'Đang tải phần thay đổi…') do |job|
              directory=File.join(InternetUpdate.store,'downloads',Time.now.strftime('%Y%m%d-%H%M%S')+'-'+SecureRandom.hex(8))
              FileUtils.mkdir_p(directory);job[:directory]=directory
              part=File.join(directory,'package.part');path=File.join(directory,'package.rbz')
              quick=!repair;entries=nil
                asset=quick ? release['quick'] : release
                File.open(part,'wb') { |file| InternetUpdate.transfer(asset['url'],file,asset['bytes'],lambda { job[:cancel] },lambda { |a,b| job[:progress]=[a,b] },asset['bytes']) }
                job[:message]=quick ? 'Đang kiểm tra thư viện có sẵn trên máy…' : 'Đang kiểm tra tính đầy đủ của gói tải…'
                raise 'Mã SHA-256 không khớp. Bản đang dùng chưa bị thay đổi.' unless Digest::SHA256.file(part).hexdigest==asset['sha256']
                begin
                  entries=UpdateArchive.inspect_file(part,release['version'],lambda { job[:cancel] },lambda { |a,b| job[:progress]=[a,b] },quick ? File.expand_path('..',__dir__) : nil,quick ? release['sha256'] : nil)
                rescue UpdateArchive::QuickBaseMismatch
                  raise 'Đã hủy.' if job[:cancel]
                  raise 'Tệp nền bị thiếu hoặc đã đổi. Không cài và không tải gói đầy đủ. Nếu muốn sửa thư viện, kiểm tra lại rồi chọn Sửa bằng gói đầy đủ.'
                end
              File.rename(part,path)
              {kind: :download,data:release,path:path,entries:entries,quick:quick}
            end
          end
        rescue => error
          set_state('error',error.message)
        end
      end
    end
    def self.show_internet_update
      if @internet_update_dialog && @internet_update_dialog.visible?
        @internet_update_dialog.bring_to_front;return
      end
      dialog=UI::HtmlDialog.new(dialog_title:'LOFIHOME · Cập nhật Internet',preferences_key:'LOFIHOME_InternetUpdate',scrollable:true,resizable:true,width:560,height:590,min_width:360,min_height:380,style:UI::HtmlDialog::STYLE_DIALOG)
      @internet_update_dialog=dialog
      controller=InternetUpdate::Controller.new(dialog);@internet_update_controller=controller
      dialog.set_file(File.join(__dir__,'html/update.html'))
      dialog.add_action_callback('lofi_update') do |_action_context,raw|
        controller.action(raw) if @internet_update_dialog.equal?(dialog)
      end
      dialog.set_on_closed { controller.close;@internet_update_dialog=nil if @internet_update_dialog.equal?(dialog) }
      dialog.show
    rescue => error
      UI.messagebox('Không mở được cập nhật: '+error.message)
    end
    def self.prepare_internet_release
      path=UI.savepanel('Tạo gói cập nhật kèm thư viện — đặt trong thư mục riêng',nil,'LOFIHOME_V317_198_SU2021_PLUS_NHOM_ZALO.rbz')
      return unless path
      path+='.rbz' unless File.extname(path).downcase=='.rbz'
      raise 'Gói RBZ này đã tồn tại. Chọn tên/thư mục mới để giữ bản phát hành cũ.' if File.exist?(path)
      manifest_path=File.join(File.dirname(path),'latest.json')
      raise 'Thư mục đã có latest.json. Chọn thư mục phát hành mới để giữ bản cũ.' if File.exist?(manifest_path)
      Sketchup.set_status_text('LOFIHOME: Đang đóng gói bản cập nhật và thư viện…')
      portable_export(path)
      data=InternetUpdate.release_manifest(path)
      File.write(manifest_path,JSON.pretty_generate(data))
      if InternetUpdate.github_release_root
        UI.messagebox("Đã tạo RBZ và latest.json.\nTrong GitHub, tạo Release với thẻ v#{InternetUpdate::VERSION}.\nTải RBZ lên trước, sau đó thêm latest.json và công bố Release khi cả hai tệp đã tải xong.\n\nĐịa chỉ cập nhật: #{InternetUpdate.source_url}\n\n#{manifest_path}\n\nGiữ riêng công cụ và khóa cấp phép của chủ sở hữu.")
      else
      UI.messagebox("Đã tạo RBZ và latest.json.\nĐăng RBZ lên trước, sau đó đăng latest.json vào cùng thư mục trên website HTTPS.\nCác máy nhập đường dẫn HTTPS đến latest.json trong nút Cập nhật.\n\n#{manifest_path}\n\nKhông giới hạn số máy cài LOFIHOME. SketchUp 2021 trở lên.")
      end
    rescue => error
      UI.messagebox('Không chuẩn bị được bản cập nhật: '+error.message)
    ensure
      Sketchup.set_status_text('LOFIHOME')
    end
  end
end
