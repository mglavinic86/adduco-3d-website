"""Build the public Croatian conversation checklist (ReportLab)."""
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from pathlib import Path
from reportlab.lib.utils import ImageReader
from PIL import Image
font=Path('/System/Library/Fonts/Supplemental/Arial.ttf')
if not font.exists(): raise RuntimeError('Set the checklist font path to a Unicode TrueType font.')
pdfmetrics.registerFont(TTFont('Body',str(font)))
c=canvas.Canvas('public/kontrolna-lista-adduco.pdf',pagesize=(595.28,841.89))
c.setTitle('Kontrolna lista za pripremu razgovora o građevinskom projektu');c.setAuthor('Adduco d.o.o.')
ink=HexColor('#121315');muted=HexColor('#55585c');red=HexColor('#d60716');paper=HexColor('#ffffff')
c.setFillColor(paper);c.rect(0,0,596,842,fill=1,stroke=0)
def text(x,y,txt,size=11,color=ink):c.setFillColor(color);c.setFont('Body',size);c.drawString(x,y,txt)
logo=Image.open('public/assets/adduco-logo.webp');c.drawImage(ImageReader(logo),44,790,width=155,height=32,mask='auto');text(388,792,'PRIPREMA ZA RAZGOVOR',8,red)
c.setStrokeColor(HexColor('#d3d5d6'));c.line(44,763,551,763)
text(44,723,'Vaš projekt počinje',30);text(44,687,'jasnim pitanjima.',30,red)
text(44,657,'Kontrolna lista za pripremu razgovora o građevinskom projektu',11)
text(44,632,'Ispunite ono što znate. Otvorena pitanja zabilježite za zajednički razgovor.',10,muted)
sections=[('01','Lokacija i namjena',['Adresa ili lokacija parcele; katastarska oznaka ako je poznata.','Što želite graditi ili urediti? Kako će se prostor koristiti?']),('02','Dostupna dokumentacija',['Imate li nacrte, projektnu dokumentaciju, dozvole ili fotografije lokacije?','Pripremite popis dokumenata koje imate i pitanja o onima koji nedostaju.']),('03','Okvirni budžet',['Koji iznos ili raspon ulaganja imate na raspolaganju?','Što očekujete da ponuda obuhvati i koje su vam stavke prioritet?']),('04','Željeni vremenski plan',['Kada biste željeli početi i završiti radove?','Postoje li važni rokovi, faze ili uvjeti pristupa lokaciji?']),('05','Pitanja za izvođača',['Koji su radovi uključeni, a koji se ugovaraju zasebno?','Kako se dogovaraju rokovi, plaćanje, izmjene i komunikacija?','Koje su obveze investitora i koja dokumentacija još treba?'])]
y=593
for number,title,lines in sections:
 text(44,y,number,9,red);text(72,y,title,15)
 yy=y-23
 for line in lines:
  c.setStrokeColor(muted);c.rect(73,yy-1,6,6,fill=0,stroke=1);text(90,yy,line,9,muted);yy-=17
 c.setStrokeColor(HexColor('#d3d5d6'));c.line(73,yy-5,550,yy-5);y=yy-37
text(44,119,'Moje bilješke / sljedeći korak',10,red)
c.setStrokeColor(HexColor('#d3d5d6'));c.line(44,101,550,101);c.line(44,80,550,80)
text(44,48,'ADDUCO d.o.o. | Metković | adduco@adduco.hr',9)
text(518,48,'1 / 1',8,muted)
c.showPage();c.save()
