using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Versioning;
using System.Windows.Forms;
using LofiLibraryUpdate;

[assembly: AssemblyTitle("LOFIHOME · Cập nhật thư viện B-063")]
[assembly: AssemblyDescription("Guarded local data update for existing LOFIHOME hosts")]
[assembly: AssemblyCompany("LOFIHOME")]
[assembly: AssemblyProduct("LOFIHOME Library Update")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]
[assembly: TargetFramework(".NETFramework,Version=v4.6.2", FrameworkDisplayName=".NET Framework 4.6.2")]

internal sealed class UpdaterForm : Form {
    private readonly Package package;
    private readonly ListView rows=new ListView();
    private readonly Label hint=new Label();
    private readonly TextBox report=new TextBox();
    private readonly Button browse=new Button(),check=new Button(),apply=new Button();
    private bool busy;
    private sealed class Row {public HostPackage Host;public string Root;}
    public UpdaterForm(Package value) {
        package=value;Text=String.IsNullOrWhiteSpace(package.Title)?"LOFIHOME · Cập nhật mẫu B-063":package.Title;
        MinimumSize=new Size(850,590);Size=new Size(1100,690);StartPosition=FormStartPosition.CenterScreen;
        Font=new Font("Segoe UI",10);AutoScaleMode=AutoScaleMode.Dpi;
        var layout=new TableLayoutPanel{Dock=DockStyle.Fill,ColumnCount=1,RowCount=5,Padding=new Padding(18)};
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute,62));layout.RowStyles.Add(new RowStyle(SizeType.Percent,60));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute,56));layout.RowStyles.Add(new RowStyle(SizeType.Absolute,50));layout.RowStyles.Add(new RowStyle(SizeType.Percent,40));
        var intro=new Label{Dock=DockStyle.Fill,Text="Chọn những thư viện cần bổ sung B-063. Đóng phần mềm và bảng LOFIHOME tương ứng trước khi cập nhật.\r\nGói sẽ kiểm tra bản nền, sao lưu và chỉ thay các tệp dữ liệu đã kê trong bản cập nhật."};
        rows.Dock=DockStyle.Fill;rows.View=View.Details;rows.CheckBoxes=true;rows.FullRowSelect=true;rows.MultiSelect=false;rows.HideSelection=false;
        rows.Columns.Add("Phần mềm",150);rows.Columns.Add("Thư mục cài đặt",700);rows.Columns.Add("Bản nền",110);
        rows.SelectedIndexChanged+=(s,e)=>ShowHint();
        hint.Dock=DockStyle.Fill;hint.Padding=new Padding(0,8,0,0);
        var buttons=new FlowLayoutPanel{Dock=DockStyle.Fill,FlowDirection=FlowDirection.LeftToRight};
        browse.Text="Chọn thư mục…";browse.AutoSize=true;browse.Click+=(s,e)=>Browse();
        check.Text="Kiểm tra";check.AutoSize=true;check.Click+=(s,e)=>Run(false);
        apply.Text="Cập nhật B-063";apply.AutoSize=true;apply.BackColor=Color.FromArgb(0,115,95);apply.ForeColor=Color.White;apply.FlatStyle=FlatStyle.Flat;apply.Click+=(s,e)=>Run(true);
        buttons.Controls.AddRange(new Control[]{browse,check,apply});
        report.Dock=DockStyle.Fill;report.Multiline=true;report.ReadOnly=true;report.ScrollBars=ScrollBars.Vertical;report.BackColor=Color.White;
        layout.Controls.Add(intro,0,0);layout.Controls.Add(rows,0,1);layout.Controls.Add(hint,0,2);layout.Controls.Add(buttons,0,3);layout.Controls.Add(report,0,4);Controls.Add(layout);
        foreach(var host in package.Hosts) {
            int added=0;
            foreach(string candidate in host.Host.default_paths??new string[0]) {
                string expanded=Environment.ExpandEnvironmentVariables(candidate);
                if(expanded.IndexOf('%')>=0||!Directory.Exists(expanded))continue;
                try {
                    string root=Engine.RootPath(expanded);
                    if(!String.IsNullOrEmpty(host.Guard.version_file)&&!File.Exists(Engine.Under(root,host.Guard.version_file)))continue;
                    var markers=(host.Guard.preserved_native_files??new GuardFile[0]).Concat(host.Guard.required_runtime_files??new GuardFile[0]);
                    if(markers.Any(f=>!File.Exists(Engine.Under(root,f.path))))continue;
                    if(!host.Guard.files.Any(f=>f.before_sha256!=null&&File.Exists(Engine.Under(root,f.path))))continue;
                    Add(host,root,true);added++;
                }catch(Exception error){report.AppendText(host.Host.name+": "+error.Message+"\r\n");}
            }
            if(added==0)Add(host,null,false);
        }
        if(rows.Items.Count>0)rows.Items[0].Selected=true;
        report.AppendText("Chưa ghi thay đổi nào. Những phần mềm không được đánh dấu sẽ không được cập nhật.\r\n");
    }
    private void Add(HostPackage host,string root,bool selected) {
        foreach(ListViewItem prior in rows.Items){var tag=(Row)prior.Tag;if(tag.Host==host&&String.Equals(tag.Root,root,StringComparison.OrdinalIgnoreCase))return;}
        var item=new ListViewItem(new[]{host.Host.name,root??"Chọn thư mục cài đặt…",host.Guard.baseline_version}){Tag=new Row{Host=host,Root=root},Checked=selected};rows.Items.Add(item);
    }
    private void ShowHint() {hint.Text=rows.SelectedItems.Count==0?"Chọn một dòng rồi bấm Chọn thư mục nếu chưa tìm thấy vị trí cài đặt.":((Row)rows.SelectedItems[0].Tag).Host.Host.folder_hint;}
    private void Browse() {
        if(busy||rows.SelectedItems.Count==0)return;
        var current=rows.SelectedItems[0];var tag=(Row)current.Tag;
        using(var dialog=new FolderBrowserDialog{Description=tag.Host.Host.folder_hint,ShowNewFolderButton=false,SelectedPath=tag.Root??""}) {
            if(dialog.ShowDialog(this)!=DialogResult.OK)return;
            try {
                string root=Engine.RootPath(dialog.SelectedPath);
                if(tag.Root==null){tag.Root=root;current.SubItems[1].Text=root;current.Checked=true;}
                else Add(tag.Host,root,true);
            }catch(Exception error){MessageBox.Show(this,error.Message,"Chưa chọn được thư mục",MessageBoxButtons.OK,MessageBoxIcon.Warning);}
        }
    }
    private List<Selection> Selected() {
        var selected=new List<Selection>();
        foreach(ListViewItem item in rows.CheckedItems){var tag=(Row)item.Tag;if(tag.Root==null)throw new InvalidOperationException("Chọn thư mục cài đặt cho "+tag.Host.Host.name+" hoặc bỏ dấu chọn dòng này.");selected.Add(new Selection{Package=tag.Host,Root=tag.Root});}
        return selected;
    }
    private static void CheckProcesses(IEnumerable<Selection> selected) {
        var found=new List<string>();
        foreach(string name in selected.SelectMany(s=>s.Package.Host.process_names??new string[0]).Distinct(StringComparer.OrdinalIgnoreCase)) {
            if(String.IsNullOrWhiteSpace(name)||name.Any(c=>!(Char.IsLetterOrDigit(c)||c=='.'||c=='_'||c=='-')))throw new InvalidDataException("Tên tiến trình trong bộ cập nhật không hợp lệ.");
            var processes=Process.GetProcessesByName(name);try{if(processes.Length>0)found.Add(name);}finally{foreach(var process in processes)process.Dispose();}
        }
        if(found.Count>0)throw new InvalidOperationException("Đóng các chương trình sau rồi bấm lại: "+String.Join(", ",found)+". Bộ cập nhật không tự đóng chương trình.");
    }
    private void Run(bool write) {
        if(busy)return;busy=true;browse.Enabled=check.Enabled=apply.Enabled=rows.Enabled=false;UseWaitCursor=true;
        try {
            var selected=Selected();CheckProcesses(selected);var plan=Engine.Verify(selected);
            if(!write){report.Text="Đã kiểm tra "+plan.Selections.Count+" thư mục.\r\nTệp cần cập nhật: "+plan.Changes.Count+". Tệp đã đúng bản mới: "+plan.AlreadyCurrent+".\r\nChưa ghi thay đổi nào.";return;}
            CheckProcesses(selected);
            string backups=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"LOFIHOME","LibraryBackups");
            var result=Engine.Apply(plan,backups);
            report.Text=result.Changed==0?"Các thư mục đã có đúng bản cập nhật này. Không ghi thêm tệp.":"Đã cập nhật "+result.Changed+" tệp cho "+plan.Selections.Count+" thư mục.\r\nBản sao phục hồi: "+result.BackupDirectory+"\r\nMở lại LOFIHOME và chọn B-063 trong thư viện.";
        }catch(Exception error){report.Text="Chưa hoàn tất cập nhật.\r\n"+error.Message;MessageBox.Show(this,report.Text,"Kết quả cập nhật",MessageBoxButtons.OK,MessageBoxIcon.Warning);}
        finally{busy=false;browse.Enabled=check.Enabled=apply.Enabled=rows.Enabled=true;UseWaitCursor=false;}
    }
    [STAThread] private static void Main() {
        Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);
        try{Application.Run(new UpdaterForm(Engine.Load(AppDomain.CurrentDomain.BaseDirectory)));}
        catch(Exception error){MessageBox.Show("Không mở được bộ cập nhật. Giải nén đầy đủ gói rồi mở lại.\r\n"+error.Message,"LOFIHOME",MessageBoxButtons.OK,MessageBoxIcon.Error);}
    }
}
