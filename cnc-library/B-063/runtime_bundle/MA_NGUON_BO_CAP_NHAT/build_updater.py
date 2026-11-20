from pathlib import Path
import hashlib,json,os,subprocess

ROOT=Path(__file__).resolve().parent
SDK=ROOT.parent/'toolchain/dotnet'
DOTNET=SDK/'dotnet'
CSC=SDK/'sdk/8.0.428/Roslyn/bincore/csc.dll'
REFS=ROOT.parent/'toolchain/net462/build/.NETFramework/v4.6.2'
OUT=ROOT/'built';OUT.mkdir(exist_ok=True)
ENV=dict(os.environ,DOTNET_CLI_TELEMETRY_OPTOUT='1',DOTNET_SKIP_FIRST_TIME_EXPERIENCE='1',DOTNET_CLI_HOME=str(ROOT/'dotnet-home'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):
    r=subprocess.run([str(a) for a in args],env=ENV,text=True,capture_output=True,timeout=90)
    if r.returncode:raise RuntimeError(r.stdout+r.stderr)
    return r.stdout+r.stderr
def quoted(p):
    p=str(p)
    if any(c in p for c in ['"','\r','\n']):raise ValueError(p)
    return '"'+p+'"'
def compile(name,args):
    rsp=OUT/(name+'.rsp');rsp.write_text('\n'.join(args)+'\n',encoding='utf-8-sig')
    output=run([DOTNET,CSC,'/noconfig','@'+str(rsp)])
    if output.strip():raise RuntimeError('Unexpected compiler diagnostics: '+output)
    return [str(DOTNET),str(CSC),'/noconfig','@'+str(rsp)]
assert sha(CSC)=='1b1253cf4fb6ba61db478c9aee3711d8941daec264e57243fae76f5e0465f293'
references=[REFS/(n+'.dll') for n in ['mscorlib','System','System.Core','System.Drawing','System.Windows.Forms','System.Runtime.Serialization','System.Xml']]
for p in references:assert p.is_file()
exe=OUT/'CAP_NHAT_THU_VIEN_B063.exe'
common=['/nologo','/nostdlib+','/langversion:5','/codepage:65001','/utf8output','/optimize+','/debug-','/deterministic+','/warnaserror+']
command=compile('winforms',common+['/target:winexe','/platform:anycpu','/out:'+quoted(exe),'/win32manifest:'+quoted(ROOT/'app.manifest')]+['/reference:'+quoted(p) for p in references]+[quoted(ROOT/'OverlayEngine.cs'),quoted(ROOT/'UpdaterUI.cs')])
initial=sha(exe);assert run(command)=='';assert sha(exe)==initial
runtime_ref=sorted((SDK/'packs/Microsoft.NETCore.App.Ref').glob('*/ref/net8.0'))[-1]
runtime_version=runtime_ref.parent.parent.name
allrefs=['/reference:'+quoted(p) for p in sorted(runtime_ref.glob('*.dll'))]
checks=OUT/'EngineChecks.dll'
compile('checks',['/nologo','/nostdlib+','/target:exe','/out:'+quoted(checks),'/warnaserror+']+allrefs+[quoted(ROOT/'OverlayEngine.cs'),quoted(ROOT/'EngineChecks.cs')])
checks.with_suffix('.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net8.0','framework':{'name':'Microsoft.NETCore.App','version':runtime_version}}}))
tests=run([DOTNET,checks]);(OUT/'ENGINE_CHECKS.txt').write_text(tests,encoding='utf-8')
inspector=OUT/'InspectPe.dll'
inspector_source=ROOT/'InspectPe.cs'
compile('inspect',['/nologo','/nostdlib+','/target:exe','/out:'+quoted(inspector)]+allrefs+[quoted(inspector_source)])
inspector.with_suffix('.runtimeconfig.json').write_text(checks.with_suffix('.runtimeconfig.json').read_text())
metadata=json.loads(run([DOTNET,inspector,exe]))
assert metadata['runtime']=='v4.0.30319' and metadata['il_only'] and not metadata['requires_32_bit'] and metadata['subsystem']=='WindowsGui'
assert not any(x['name'] in {'System.Private.CoreLib','netstandard','System.Runtime'} for x in metadata['references'])
report={'status':'passed','target':'.NET Framework 4.6.2','compiler_sdk':'8.0.428','compiler_sha256':sha(CSC),'exe':exe.name,'exe_sha256':initial,'exe_bytes':exe.stat().st_size,'deterministic_repeat_equal':True,'compiler_errors':0,'compiler_warnings':0,'source_sha256':{p.name:sha(p) for p in [ROOT/'OverlayEngine.cs',ROOT/'UpdaterUI.cs',ROOT/'EngineChecks.cs',ROOT/'app.manifest']},'reference_sha256':{p.name:sha(p) for p in references},'pe_metadata':metadata,'engine_checks':tests.splitlines(),'scope':'Windows .NET Framework cross-compilation and PE inspection; actual transaction engine tested on Linux net8. Windows UI and native host operation were not executed.'}
(OUT/'BUILD_VERIFICATION.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2,ensure_ascii=False))
