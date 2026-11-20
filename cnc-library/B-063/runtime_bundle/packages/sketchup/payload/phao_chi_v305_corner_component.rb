# encoding: UTF-8
require 'sketchup.rb'
require File.join(File.dirname(__FILE__),'phao_chi_v305_corner_component','version_guard')
return unless LVN::PhaoChiV305CornerLiteHost.allow_load?
require 'extensions.rb'
require File.join(File.dirname(__FILE__),'phao_chi_v305_corner_component','runtime_compat')
module LVN
  module PhaoChiV305CornerLiteLoader
    unless const_defined?(:REGISTERED)
      ext = SketchupExtension.new('LOFIHOME PHÀO CHỈ V317.198 CNC ĐỘC LẬP', 'phao_chi_v305_corner_component/main')
      ext.description = 'Phào chỉ, lam sóng và bộ CNC LOFIHOME riêng; 305 mẫu và 24 mẫu thiết kế, xuất SVG/DXF/SKP, dùng thử 3 tháng, khóa vĩnh viễn riêng cho từng máy'
      ext.version = 'V317.198-SU2021-PLUS'
      ext.creator = 'LVN Tools'
      Sketchup.register_extension(ext, true)
      const_set(:REGISTERED, true)
    end
  end
end
