using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;

namespace LofiLibraryUpdate {
    [DataContract] public sealed class IndexData {
        [DataMember] public string format;
        [DataMember] public string title;
        [DataMember] public HostData[] hosts;
    }
    [DataContract] public sealed class HostData {
        [DataMember] public string id;
        [DataMember] public string name;
        [DataMember] public string manifest;
        [DataMember] public string payload;
        [DataMember] public string[] default_paths;
        [DataMember] public string[] process_names;
        [DataMember] public string folder_hint;
    }
    [DataContract] public sealed class OverlayData {
        [DataMember] public string format;
        [DataMember] public string product;
        [DataMember] public string baseline_version;
        [DataMember] public string installation_path;
        [DataMember] public string version_file;
        [DataMember] public string version_file_sha256;
        [DataMember] public UpdateFile[] files;
        [DataMember] public GuardFile[] preserved_native_files;
        [DataMember] public GuardFile[] required_runtime_files;
    }
    [DataContract] public sealed class UpdateFile {
        [DataMember] public string path;
        [DataMember] public string before_sha256;
        [DataMember] public string sha256;
        [DataMember] public long bytes;
    }
    [DataContract] public sealed class GuardFile {
        [DataMember] public string path;
        [DataMember] public string sha256;
    }
    public sealed class HostPackage {
        public HostData Host;
        public OverlayData Guard;
        public string ManifestPath, ManifestHash, PayloadRoot;
    }
    public sealed class Package {
        public string Root, Title;
        public List<HostPackage> Hosts=new List<HostPackage>();
    }
    public sealed class Selection {
        public HostPackage Package;
        public string Root;
    }
    public sealed class Change {
        public Selection Selection;
        public UpdateFile File;
        public string Target, Source, InitialHash, Staged, Backup;
        public bool Committed;
    }
    public sealed class Plan {
        public List<Selection> Selections=new List<Selection>();
        public List<Change> Changes=new List<Change>();
        public int AlreadyCurrent;
    }
    public sealed class Result {
        public int Changed, AlreadyCurrent;
        public string BackupDirectory;
    }
    public static class Engine {
        private static readonly StringComparer CI=StringComparer.OrdinalIgnoreCase;
        public static T ReadJson<T>(string path) {
            if(!File.Exists(path)||new FileInfo(path).Length>4*1024*1024)throw new InvalidDataException("Không đọc được tệp cấu hình: "+path);
            RejectLinks(path);
            using(var stream=File.OpenRead(path))return (T)new DataContractJsonSerializer(typeof(T)).ReadObject(stream);
        }
        public static void WriteJson<T>(string path,T value) {
            using(var stream=new FileStream(path,FileMode.CreateNew,FileAccess.Write,FileShare.None))new DataContractJsonSerializer(typeof(T)).WriteObject(stream,value);
        }
        public static string Hash(string path) {
            using(var h=SHA256.Create())using(var s=File.OpenRead(path))return BitConverter.ToString(h.ComputeHash(s)).Replace("-","").ToLowerInvariant();
        }
        private static void HashText(string text) {
            if(text==null||text.Length!=64||text.Any(c=>!((c>='0'&&c<='9')||(c>='a'&&c<='f'))))throw new InvalidDataException("Mã SHA256 không hợp lệ.");
        }
        public static string Relative(string path) {
            if(String.IsNullOrWhiteSpace(path)||Path.IsPathRooted(path)||path.StartsWith("/")||path.StartsWith("\\"))throw new InvalidDataException("Đường dẫn tệp phải tương đối.");
            string[] parts=path.Replace('\\','/').Split('/');
            foreach(string part in parts) {
                if(part.Length==0||part=="."||part==".."||part.EndsWith(".")||part.EndsWith(" ")||part.IndexOfAny(new[]{'<','>',':','"','|','?','*'})>=0||part.Any(c=>c<32))throw new InvalidDataException("Đường dẫn tệp không an toàn: "+path);
                string stem=part.Split('.')[0].ToUpperInvariant();
                if(new[]{"CON","PRN","AUX","NUL"}.Contains(stem)||(stem.Length==4&&(stem.StartsWith("COM")||stem.StartsWith("LPT"))&&stem[3]>='1'&&stem[3]<='9'))throw new InvalidDataException("Tên tệp không hợp lệ trên Windows: "+path);
            }
            return String.Join(Path.DirectorySeparatorChar.ToString(),parts);
        }
        public static string RootPath(string path) {
            if(String.IsNullOrWhiteSpace(path)||!Path.IsPathRooted(path))throw new InvalidDataException("Chọn thư mục cài đặt đầy đủ.");
            string root=Path.GetFullPath(path).TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar);
            if(root.Length==0||CI.Equals(root,Path.GetPathRoot(root).TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar)))throw new InvalidDataException("Không thể chọn gốc ổ đĩa làm thư mục cài đặt.");
            if(!Directory.Exists(root))throw new DirectoryNotFoundException("Không có thư mục: "+root);
            RejectLinks(root);return root;
        }
        public static string Under(string root,string relative) {
            string result=Path.GetFullPath(Path.Combine(root,Relative(relative)));
            if(!result.StartsWith(root.TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Đường dẫn nằm ngoài thư mục đã chọn.");
            RejectLinks(result);return result;
        }
        public static void RejectLinks(string path) {
            string p=Path.GetFullPath(path);
            while(!String.IsNullOrEmpty(p)) {
                // GetAttributes detects dangling reparse points as well on supported filesystems.
                try {if((File.GetAttributes(p)&FileAttributes.ReparsePoint)!=0)throw new InvalidDataException("Không cập nhật qua liên kết thư mục/tệp: "+p);}
                catch(FileNotFoundException){}catch(DirectoryNotFoundException){}
                string parent=Path.GetDirectoryName(p);if(parent==p)break;p=parent;
            }
        }
        public static Package Load(string root) {
            root=RootPath(root);
            var index=ReadJson<IndexData>(Under(root,"bo_cai.json"));
            if(index.format!="LOFIHOME_LIBRARY_INSTALLER_1"||index.hosts==null||index.hosts.Length==0||index.hosts.Length>20)throw new InvalidDataException("Không đúng cấu trúc bộ cập nhật.");
            var output=new Package{Root=root,Title=index.title};var ids=new HashSet<string>(CI);
            foreach(var host in index.hosts) {
                if(host==null||String.IsNullOrWhiteSpace(host.id)||!ids.Add(host.id)||host.id.Any(c=>!(Char.IsLetterOrDigit(c)||c=='_'||c=='-')))throw new InvalidDataException("Mã phần mềm trống hoặc trùng.");
                string manifest=Under(root,host.manifest),payload=RootPath(Under(root,host.payload));
                var guard=ReadJson<OverlayData>(manifest);ValidateSchema(guard);
                output.Hosts.Add(new HostPackage{Host=host,Guard=guard,ManifestPath=manifest,ManifestHash=Hash(manifest),PayloadRoot=payload});
            }
            return output;
        }
        private static void ValidateSchema(OverlayData guard) {
            if(guard==null||guard.format!="LOFIHOME_LIBRARY_OVERLAY_1"||String.IsNullOrWhiteSpace(guard.product)||String.IsNullOrWhiteSpace(guard.baseline_version)||guard.files==null||guard.files.Length==0||guard.files.Length>20000)throw new InvalidDataException("Bản kê cập nhật không hợp lệ.");
            var files=new HashSet<string>(CI);
            foreach(var f in guard.files) {
                if(f==null)throw new InvalidDataException("Thiếu bản kê tệp.");
                string rel=Relative(f.path);if(!files.Add(rel))throw new InvalidDataException("Tệp cập nhật bị lặp: "+f.path);
                string ext=Path.GetExtension(rel);if(CI.Equals(ext,".exe")||CI.Equals(ext,".dll")||CI.Equals(ext,".rhp"))throw new InvalidDataException("Gói dữ liệu không được thay chương trình gốc: "+f.path);
                if(f.bytes<0||f.bytes>100*1024*1024)throw new InvalidDataException("Kích thước tệp ngoài giới hạn.");
                HashText(f.sha256);if(f.before_sha256!=null)HashText(f.before_sha256);
            }
            foreach(var f in AllGuards(guard)) {
                if(f==null)throw new InvalidDataException("Thiếu tệp bảo vệ.");
                string rel=Relative(f.path);HashText(f.sha256);
                if(files.Contains(rel))throw new InvalidDataException("Tệp giữ nguyên nằm trong danh sách thay đổi: "+rel);
            }
            if(!String.IsNullOrEmpty(guard.version_file)){Relative(guard.version_file);HashText(guard.version_file_sha256);}
        }
        private static IEnumerable<GuardFile> AllGuards(OverlayData guard) {
            return (guard.preserved_native_files??new GuardFile[0]).Concat(guard.required_runtime_files??new GuardFile[0]);
        }
        private static void RequireHash(string path,string wanted,string label) {
            if(!File.Exists(path)||!CI.Equals(Hash(path),wanted))throw new InvalidDataException(label+": "+path);
        }
        private static void GuardRuntime(Selection selection) {
            var g=selection.Package.Guard;
            foreach(var f in AllGuards(g))RequireHash(Under(selection.Root,f.path),f.sha256,"Không đúng tệp cầu nối hoặc tệp nền cần giữ nguyên");
            if(!String.IsNullOrEmpty(g.version_file)) {
                string file=Under(selection.Root,g.version_file);
                if(!File.Exists(file))throw new InvalidDataException("Thiếu tệp nhận dạng phiên bản: "+file);
                string got=Hash(file);var replacement=g.files.FirstOrDefault(f=>CI.Equals(Relative(f.path),Relative(g.version_file)));
                if(!CI.Equals(got,g.version_file_sha256)&&(replacement==null||!CI.Equals(got,replacement.sha256)))throw new InvalidDataException("Không đúng bản nền: "+file);
            }
        }
        public static Plan Verify(IEnumerable<Selection> selected) {
            var plan=new Plan();var roots=new List<string>();
            foreach(var supplied in selected) {
                if(supplied==null||supplied.Package==null)throw new InvalidDataException("Chưa chọn phần mềm.");
                var selection=new Selection{Package=supplied.Package,Root=RootPath(supplied.Root)};
                foreach(string prior in roots)if(CI.Equals(prior,selection.Root)||prior.StartsWith(selection.Root+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase)||selection.Root.StartsWith(prior+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Các thư mục cập nhật trùng hoặc lồng nhau.");
                roots.Add(selection.Root);plan.Selections.Add(selection);ValidateSchema(selection.Package.Guard);
                RequireHash(selection.Package.ManifestPath,selection.Package.ManifestHash,"Bản kê đã thay đổi; mở lại bộ cập nhật");
                RootPath(selection.Package.PayloadRoot);GuardRuntime(selection);
                foreach(var f in selection.Package.Guard.files) {
                    string source=Under(selection.Package.PayloadRoot,f.path),target=Under(selection.Root,f.path);
                    RequireHash(source,f.sha256,"Tệp trong gói tải bị thiếu hoặc khác mã");
                    if(new FileInfo(source).Length!=f.bytes)throw new InvalidDataException("Sai kích thước tệp nguồn: "+source);
                    if(Directory.Exists(target))throw new InvalidDataException("Vị trí tệp đang là một thư mục: "+target);
                    string actual=File.Exists(target)?Hash(target):null;
                    if(CI.Equals(actual,f.sha256)){plan.AlreadyCurrent++;continue;}
                    if(!CI.Equals(actual,f.before_sha256))throw new InvalidDataException("Tệp đang dùng không đúng bản nền; chưa cập nhật: "+target);
                    plan.Changes.Add(new Change{Selection=selection,File=f,Source=source,Target=target,InitialHash=actual});
                }
            }
            if(plan.Selections.Count==0)throw new InvalidDataException("Chọn ít nhất một phần mềm cần cập nhật.");
            return plan;
        }
        private static void SamePlan(Plan original,Plan current) {
            if(original.Changes.Count!=current.Changes.Count||original.AlreadyCurrent!=current.AlreadyCurrent)throw new IOException("Các tệp đã thay đổi sau khi kiểm tra; hãy kiểm tra lại.");
            for(int i=0;i<original.Changes.Count;i++)if(!CI.Equals(original.Changes[i].Target,current.Changes[i].Target)||!CI.Equals(original.Changes[i].InitialHash,current.Changes[i].InitialHash))throw new IOException("Tệp đích đã thay đổi sau khi kiểm tra.");
        }
        private static void MakeParent(string path,List<string> made) {
            string parent=Path.GetDirectoryName(path);var missing=new List<string>();
            while(!Directory.Exists(parent)){if(File.Exists(parent))throw new IOException("Không thể tạo thư mục: "+parent);missing.Add(parent);parent=Path.GetDirectoryName(parent);}
            RejectLinks(parent);
            missing.Reverse();foreach(string item in missing){Directory.CreateDirectory(item);made.Add(item);}
        }
        private static void CopyVerified(string source,string destination,string hash) {
            RejectLinks(source);RejectLinks(destination);
            using(var a=new FileStream(source,FileMode.Open,FileAccess.Read,FileShare.Read))
            using(var b=new FileStream(destination,FileMode.CreateNew,FileAccess.Write,FileShare.None)){a.CopyTo(b);b.Flush(true);}
            RequireHash(destination,hash,"Lỗi kiểm tra bản sao");
        }
        private static void Restore(Change change) {
            RejectLinks(change.Target);
            string got=File.Exists(change.Target)?Hash(change.Target):null;
            if(!CI.Equals(got,change.File.sha256))throw new IOException("Tệp vừa thay đổi từ ngoài bộ cập nhật, giữ bản sao để khôi phục: "+change.Target);
            if(change.InitialHash==null){RejectLinks(change.Target);File.Delete(change.Target);return;}
            string temp=Path.Combine(Path.GetDirectoryName(change.Target),"~b063-restore-"+Guid.NewGuid().ToString("N")+".tmp");
            try{CopyVerified(change.Backup,temp,change.InitialHash);RejectLinks(change.Target);File.Replace(temp,change.Target,null);RejectLinks(change.Target);RequireHash(change.Target,change.InitialHash,"Khôi phục chưa khớp bản gốc");}
            finally{RejectLinks(temp);if(File.Exists(temp))File.Delete(temp);}
        }
        public static Result Apply(Plan plan,string backupBase) {return ApplyForTest(plan,backupBase,null);}
        // The callback is used only by the headless rollback test; GUI passes none.
        internal static Result ApplyForTest(Plan plan,string backupBase,Action<int> afterCommit) {
            SamePlan(plan,Verify(plan.Selections));
            if(plan.Changes.Count==0)return new Result{Changed=0,AlreadyCurrent=plan.AlreadyCurrent};
            string parent=Path.GetFullPath(backupBase);RejectLinks(parent);
            foreach(var selection in plan.Selections)if(CI.Equals(parent,selection.Root)||parent.StartsWith(selection.Root+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Thư mục sao lưu phải nằm ngoài thư mục phần mềm.");
            Directory.CreateDirectory(parent);RejectLinks(parent);
            string backup=Path.Combine(parent,DateTime.UtcNow.ToString("yyyyMMdd-HHmmss")+"-"+Guid.NewGuid().ToString("N").Substring(0,12));
            Directory.CreateDirectory(backup);var made=new List<string>();int committed=0;
            var journal=new StringBuilder("LOFIHOME B-063 update\r\nUTC "+DateTime.UtcNow.ToString("o")+"\r\n");
            try {
                for(int i=0;i<plan.Changes.Count;i++) {
                    var change=plan.Changes[i];string tag=i.ToString("D5");
                    change.Staged=Path.Combine(backup,tag+".new");CopyVerified(change.Source,change.Staged,change.File.sha256);
                    if(change.InitialHash!=null){change.Backup=Path.Combine(backup,tag+".before");CopyVerified(change.Target,change.Backup,change.InitialHash);}
                    journal.AppendLine(tag+"\t"+change.Target+"\t"+(change.InitialHash??"ABSENT")+"\t"+change.File.sha256);
                }
                File.WriteAllText(Path.Combine(backup,"FILES.txt"),journal.ToString(),new UTF8Encoding(true));
                SamePlan(plan,Verify(plan.Selections));
                foreach(var change in plan.Changes) {
                    RejectLinks(change.Target);GuardRuntime(change.Selection);
                    string current=File.Exists(change.Target)?Hash(change.Target):null;
                    if(!CI.Equals(current,change.InitialHash))throw new IOException("Tệp đích thay đổi trước lúc ghi: "+change.Target);
                    MakeParent(change.Target,made);
                    string temp=Path.Combine(Path.GetDirectoryName(change.Target),"~b063-"+Guid.NewGuid().ToString("N")+".tmp");
                    try {
                        CopyVerified(change.Staged,temp,change.File.sha256);
                        RejectLinks(change.Target);
                        current=File.Exists(change.Target)?Hash(change.Target):null;
                        if(!CI.Equals(current,change.InitialHash))throw new IOException("Tệp đích thay đổi trong lúc chuẩn bị ghi: "+change.Target);
                        if(change.InitialHash==null)File.Move(temp,change.Target);else File.Replace(temp,change.Target,null);
                        change.Committed=true;committed++;
                        RequireHash(change.Target,change.File.sha256,"Ghi tệp chưa khớp mã nguồn");
                        if(afterCommit!=null)afterCommit(committed);
                    }finally{RejectLinks(temp);if(File.Exists(temp))File.Delete(temp);}
                }
                foreach(var selection in plan.Selections)GuardRuntime(selection);
                File.WriteAllText(Path.Combine(backup,"RESULT.txt"),"SUCCESS\r\nChanged "+committed+"\r\n",new UTF8Encoding(true));
                return new Result{Changed=committed,AlreadyCurrent=plan.AlreadyCurrent,BackupDirectory=backup};
            } catch(Exception error) {
                var failures=new List<string>();
                foreach(var change in plan.Changes.AsEnumerable().Reverse())if(change.Committed){try{Restore(change);change.Committed=false;}catch(Exception rollback){failures.Add(rollback.Message);}}
                foreach(string dir in made.AsEnumerable().Reverse())try{RejectLinks(dir);if(Directory.Exists(dir)&&!Directory.EnumerateFileSystemEntries(dir).Any()){RejectLinks(dir);Directory.Delete(dir);}}catch(Exception cleanup){failures.Add(cleanup.Message);}
                string message=error.Message+"\r\n"+(failures.Count==0?"Đã khôi phục toàn bộ tệp đã thay đổi.":"Có tệp chưa thể tự khôi phục:\r\n"+String.Join("\r\n",failures))+"\r\nBản sao: "+backup;
                try{File.WriteAllText(Path.Combine(backup,"RESULT.txt"),"FAILED\r\n"+message,new UTF8Encoding(true));}catch(IOException){}catch(UnauthorizedAccessException){}
                throw new IOException(message,error);
            }
        }
    }
}
