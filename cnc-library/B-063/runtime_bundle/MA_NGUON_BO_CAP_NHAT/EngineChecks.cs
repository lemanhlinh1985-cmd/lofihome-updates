using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using LofiLibraryUpdate;

internal static class EngineChecks {
    private static readonly List<string> Passed=new List<string>();
    private static void Assert(bool condition,string message){if(!condition)throw new Exception(message);}
    private static void Reject(Action action){bool bad=false;try{action();}catch(Exception){bad=true;}Assert(bad,"Expected rejection");}
    private static string Put(string root,string relative,string content){string file=Path.Combine(root,relative);Directory.CreateDirectory(Path.GetDirectoryName(file));File.WriteAllText(file,content);return file;}
    private sealed class Fixture : IDisposable {
        public string Root,PackageRoot,Backups;
        public Package Package;
        public List<Selection> Selections;
        public Fixture() {
            Root=Path.Combine(Path.GetTempPath(),"lofi-b063-check-"+Guid.NewGuid().ToString("N"));PackageRoot=Path.Combine(Root,"package");Backups=Path.Combine(Root,"backups");Directory.CreateDirectory(PackageRoot);
            var index=new IndexData{format="LOFIHOME_LIBRARY_INSTALLER_1",title="Test",hosts=new HostData[2]};
            for(int i=0;i<2;i++) {
                string name="host"+i,target=Path.Combine(Root,name),source=Path.Combine(PackageRoot,name,"payload");Directory.CreateDirectory(target);
                var rows=new List<UpdateFile>();
                foreach(string relative in new[]{"old.txt","version.json","nested/B-063.json"}) {
                    string before=relative.StartsWith("nested/")?null:Engine.Hash(Put(target,relative,"before "+i+" "+relative));
                    string after=Put(source,relative,"accepted B-063 r2 "+i+" "+relative);
                    rows.Add(new UpdateFile{path=relative,before_sha256=before,sha256=Engine.Hash(after),bytes=new FileInfo(after).Length});
                }
                var guard=new OverlayData{format="LOFIHOME_LIBRARY_OVERLAY_1",product=name,baseline_version="1.0",version_file="version.json",version_file_sha256=rows[1].before_sha256,files=rows.ToArray(),preserved_native_files=new[]{new GuardFile{path="bridge.exe",sha256=Engine.Hash(Put(target,"bridge.exe","native bridge unchanged"))}},required_runtime_files=new[]{new GuardFile{path="license.xml",sha256=Engine.Hash(Put(target,"license.xml","license unchanged"))}}};
                string manifest=Path.Combine(PackageRoot,name,"baseline_guard.json");Engine.WriteJson(manifest,guard);
                index.hosts[i]=new HostData{id=name,name=name,manifest=name+"/baseline_guard.json",payload=name+"/payload",default_paths=new string[0],process_names=new string[0]};
            }
            Engine.WriteJson(Path.Combine(PackageRoot,"bo_cai.json"),index);Package=Engine.Load(PackageRoot);
            Selections=Package.Hosts.Select(h=>new Selection{Package=h,Root=Path.Combine(Root,h.Host.id)}).ToList();
        }
        public Dictionary<string,string> Snapshot(){return Selections.SelectMany(s=>Directory.GetFiles(s.Root,"*",SearchOption.AllDirectories)).ToDictionary(x=>x,x=>Engine.Hash(x));}
        public void Same(Dictionary<string,string> before){var after=Snapshot();Assert(before.Count==after.Count&&before.All(p=>after.ContainsKey(p.Key)&&after[p.Key]==p.Value),"Target snapshot changed unexpectedly");}
        public void Dispose(){Directory.Delete(Root,true);}
    }
    private static void Test(string name,Action body){body();Passed.Add(name);Console.WriteLine("PASS "+name);}
    [DataContract] private sealed class RootRequest {[DataMember] public string id=null;[DataMember] public string root=null;}
    private static int Main(string[] args) {
        try {
            if(args.Length==3&&args[0]=="--verify") {
                var package=Engine.Load(args[1]);var requests=Engine.ReadJson<RootRequest[]>(args[2]);
                var selections=requests.Select(r=>new Selection{Package=package.Hosts.Single(h=>h.Host.id==r.id),Root=r.root});
                var plan=Engine.Verify(selections);Console.WriteLine("VERIFIED roots="+plan.Selections.Count+" changes="+plan.Changes.Count+" already="+plan.AlreadyCurrent);return 0;
            }
            Test("two-host atomic update, unchanged runtimes and idempotence",()=>{using(var f=new Fixture()) {
                var plan=Engine.Verify(f.Selections);Assert(plan.Changes.Count==6,"Expected six changes");var result=Engine.Apply(plan,f.Backups);Assert(result.Changed==6,"Expected six writes");
                foreach(var s in f.Selections){foreach(var file in s.Package.Guard.files)Assert(Engine.Hash(Path.Combine(s.Root,file.path))==file.sha256,"Output mismatch");foreach(var guard in s.Package.Guard.preserved_native_files.Concat(s.Package.Guard.required_runtime_files))Assert(Engine.Hash(Path.Combine(s.Root,guard.path))==guard.sha256,"Runtime changed");}
                var current=Engine.Verify(f.Selections);Assert(current.Changes.Count==0&&current.AlreadyCurrent==6,"Updated version hash must be accepted");Assert(Engine.Apply(current,f.Backups).Changed==0,"Second apply wrote files");
                Assert(Directory.GetFiles(result.BackupDirectory,"*.before").Length==4,"Missing previous files");
            }});
            Test("wrong second-host baseline rejects every target before writes",()=>{using(var f=new Fixture()){Put(f.Selections[1].Root,"old.txt","user change");var state=f.Snapshot();Reject(()=>Engine.Verify(f.Selections));f.Same(state);Assert(!Directory.Exists(f.Backups),"Wrote backup before verification");}});
            Test("wrong source hash rejects all hosts",()=>{using(var f=new Fixture()){Put(f.Package.Hosts[1].PayloadRoot,"old.txt","corrupt download");var state=f.Snapshot();Reject(()=>Engine.Verify(f.Selections));f.Same(state);}});
            Test("native and additional runtime hashes are mandatory",()=>{using(var f=new Fixture()){Put(f.Selections[1].Root,"license.xml","changed");var state=f.Snapshot();Reject(()=>Engine.Verify(f.Selections));f.Same(state);}using(var f=new Fixture()){Put(f.Selections[1].Root,"bridge.exe","changed");Reject(()=>Engine.Verify(f.Selections));}});
            Test("unsafe Windows and relative paths rejected",()=>{foreach(string p in new[]{"../x","nested/../../x","C:\\outside","/absolute","a//b","CON.txt","a:b","a.\\x","./x","a\\..\\b","NUL","a\\LPT9.txt","x ","\\\\server\\file"})Reject(()=>Engine.Relative(p));});
            Test("source and target symlinks rejected",()=>{using(var f=new Fixture()){string nested=Path.Combine(f.Selections[0].Root,"nested"),outside=Path.Combine(f.Root,"outside");Directory.CreateDirectory(outside);Directory.CreateSymbolicLink(nested,outside);Reject(()=>Engine.Verify(f.Selections));Directory.Delete(nested);}using(var f=new Fixture()){string nested=Path.Combine(f.Package.Hosts[0].PayloadRoot,"nested"),saved=nested+"_saved";Directory.Move(nested,saved);Directory.CreateSymbolicLink(nested,saved);Reject(()=>Engine.Verify(f.Selections));Directory.Delete(nested);}});
            Test("rollback restores both hosts after four committed files",()=>{using(var f=new Fixture()){var state=f.Snapshot();var plan=Engine.Verify(f.Selections);Reject(()=>Engine.ApplyForTest(plan,f.Backups,n=>{if(n==4)throw new IOException("Injected commit failure");}));f.Same(state);Assert(!Directory.Exists(Path.Combine(f.Selections[0].Root,"nested")),"New directory left after rollback");string log=Directory.GetFiles(f.Backups,"RESULT.txt",SearchOption.AllDirectories).Single();Assert(File.ReadAllText(log).Contains("FAILED"),"No recovery journal");}});
            Test("rollback refuses a substituted parent symlink without deleting outside data",()=>{using(var f=new Fixture()){
                string nested=Path.Combine(f.Selections[0].Root,"nested"),held=Path.Combine(f.Root,"held-original"),outside=Path.Combine(f.Root,"outside");Directory.CreateDirectory(outside);
                string external=Path.Combine(outside,"B-063.json");File.Copy(Path.Combine(f.Package.Hosts[0].PayloadRoot,"nested/B-063.json"),external);string expected=Engine.Hash(external);
                var plan=Engine.Verify(f.Selections);Reject(()=>Engine.ApplyForTest(plan,f.Backups,n=>{if(n==3){Directory.Move(nested,held);Directory.CreateSymbolicLink(nested,outside);throw new IOException("Injected parent substitution");}}));
                Assert(File.Exists(external)&&Engine.Hash(external)==expected,"Rollback deleted or changed outside data");
                string log=Directory.GetFiles(f.Backups,"RESULT.txt",SearchOption.AllDirectories).Single();Assert(File.ReadAllText(log).Contains("liên kết"),"No explicit reparse refusal");Directory.Delete(nested);
            }});
            Test("stale verification rejected before backup or target writes",()=>{using(var f=new Fixture()){var plan=Engine.Verify(f.Selections);Put(f.Selections[1].Root,"old.txt","changed after check");var state=f.Snapshot();Reject(()=>Engine.Apply(plan,f.Backups));f.Same(state);Assert(!Directory.Exists(f.Backups),"Backup created from stale plan");}});
            Test("already-current rows can coexist with old rows",()=>{using(var f=new Fixture()){var h=f.Package.Hosts[0];File.Copy(Path.Combine(h.PayloadRoot,"old.txt"),Path.Combine(f.Selections[0].Root,"old.txt"),true);var plan=Engine.Verify(f.Selections);Assert(plan.Changes.Count==5&&plan.AlreadyCurrent==1,"Mixed verified state refused");Assert(Engine.Apply(plan,f.Backups).Changed==5,"Incorrect mixed update count");}});
            Test("backup failure cannot modify targets",()=>{using(var f=new Fixture()){var state=f.Snapshot();var plan=Engine.Verify(f.Selections);File.WriteAllText(f.Backups,"blocked by regular file");Reject(()=>Engine.Apply(plan,f.Backups));f.Same(state);}});
            Test("EXE DLL RHP mutation, duplicate paths and runtime overlap rejected",()=>{foreach(string suffix in new[]{".exe",".DLL",".rhp"})using(var f=new Fixture()){f.Package.Hosts[0].Guard.files[0].path="bridge"+suffix;Reject(()=>Engine.Verify(f.Selections));}using(var f=new Fixture()){f.Package.Hosts[0].Guard.files[0].path="version.json";Reject(()=>Engine.Verify(f.Selections));}using(var f=new Fixture()){f.Package.Hosts[0].Guard.preserved_native_files[0].path="old.txt";Reject(()=>Engine.Verify(f.Selections));}});
            Test("duplicate or nested selected roots rejected",()=>{using(var f=new Fixture()){Reject(()=>Engine.Verify(new[]{f.Selections[0],f.Selections[0]}));string nested=Path.Combine(f.Selections[0].Root,"nested");Directory.CreateDirectory(nested);Reject(()=>Engine.Verify(new[]{f.Selections[0],new Selection{Package=f.Selections[1].Package,Root=nested}}));}});
            Console.WriteLine("ALL PASSED "+Passed.Count+" meaningful engine checks; no native Windows UI execution.");return 0;
        }catch(Exception error){Console.Error.WriteLine(error);return 1;}
    }
}
