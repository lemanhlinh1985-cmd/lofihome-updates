LOFIHOME - DONG BO DXF DA HOAN THANH LEN GITHUB

Yeu cau: Python 3.9 tro len. Khi dua tep len GitHub, can GitHub CLI (gh)
da dang nhap san va co quyen ghi kho lemanhlinh1985-cmd/lofihome-updates.
Tien ich khong mo dang nhap, khong luu token va khong tu ket noi tai khoan.

1. Chuan bi tep va danh muc tren may (khong gui len GitHub):

python automation/lofihome_dxf.py stage --root . --dxf L-016.dxf --unit mm --preview L-016_xem_truoc.png --width-mm 561.6164708754725 --height-mm 1965.6579480321088

Ten DXF duoc giu nguyen. Don vi phai duoc khai bao mm; tien ich khong doi
kich thuoc/ty le. Preview, chieu rong va chieu cao la tuy chon.

2. Kiem tra tep, hash va danh muc da chuan bi:

python automation/lofihome_dxf.py check --root .

3. Xem thay doi se dua len GitHub (chi doc GitHub):

python automation/lofihome_dxf.py publish --root . --model L-016

4. Dua tep va danh muc len GitHub trong cung mot commit:

python automation/lofihome_dxf.py publish --root . --model L-016 --publish

Lenh publish doc danh muc hien tai tren GitHub, giu cac mau khac, them/cap
nhat mau dang xu ly. Neu noi dung da giong het thi khong tao commit moi.
Neu nhanh bi nguoi khac cap nhat trong luc gui, lenh dung de tranh ghi de.
Co the chay lai de doc va hop nhat danh muc moi nhat. Khong force push.

Pham vi ghi tu xa chi gom cnc-library/dxf/<ma-ban-ve>/... va
cnc-library/dxf/catalog.json. Khong thay doi feed latest.json, ban phat hanh,
goi cai dat, hoac workflow cua cac phan mem hien tai.

Tu dong hoa: bo xuat DXF can goi buoc stage va publish sau khi xuat va kiem
tra thanh cong. Chi ket noi GitHub se chua tao ra buoc goi nay. Tien ich
khong chay ngam, khong theo doi moi tep cua ChatGPT/Library/Desktop.

Kiem tra DXF o day chi kiem tra cau truc tep van ban, du lieu so huu han,
ENTITIES/EOF va don vi khai bao. Khong xac nhan duong bao kin, lo/vung vat
lieu, kha nang gia cong, hay su tuong thich thuc te voi phan mem CNC.
Viec dua DXF len kho khong tu tao dinh dang mau goc cho sau phan mem.

Ma ten ho tro chu/so Unicode (gom ten Trung Quoc va tieng Viet), dau phu
ket hop, dau cham, gach duoi, gach ngang; bat dau bang chu/so, toi da
80 ky tu va 240 byte UTF-8. Ten goc duoc giu nguyen, khong phien am hay
tu chuan hoa ten. Ten trung sau khi so sanh khong phan biet hoa/thuong
va chuan hoa Unicode se bi tu choi de tranh ghi de nham mau.
Khong chap nhan ky tu dieu khien/dinh dang, ky tu duong dan, ten thiet bi
danh rieng cua Windows, hoac dau cham o cuoi ten.
DXF toi da 25 MiB, PNG toi da 10 MiB.

Vi du ten Unicode: --dxf "中式1.dxf" va --model "中式1".

Trang thai thanh cong co the la staged, checked, dry_run, unchanged,
published. Chi published kem commit_url moi xac nhan nhanh GitHub da duoc
cap nhat. Tep nguon khong bi thay doi byte khi dong bo.
