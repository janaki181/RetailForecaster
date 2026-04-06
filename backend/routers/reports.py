import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from lxml import etree
from sqlalchemy.orm import Session

from database import get_db
from models import Sale, Product
from auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = (
        db.query(Sale, Product)
        .join(Product, Product.id == Sale.product_id)
        .order_by(Sale.sale_date.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "product", "customer_name", "channel", "quantity", "revenue", "status", "sale_date"])
    for s, p in rows:
        writer.writerow([s.id, p.name, s.customer_name, s.channel, s.quantity, s.revenue, s.status, s.sale_date])
    output.seek(0)

    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sales.csv"})


@router.get("/export/xml")
def export_xml(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = (
        db.query(Sale, Product)
        .join(Product, Product.id == Sale.product_id)
        .order_by(Sale.sale_date.desc())
        .all()
    )

    root = etree.Element("sales")
    for s, p in rows:
        n = etree.SubElement(root, "sale")
        etree.SubElement(n, "id").text = str(s.id)
        etree.SubElement(n, "product").text = p.name
        etree.SubElement(n, "customer_name").text = s.customer_name
        etree.SubElement(n, "channel").text = s.channel
        etree.SubElement(n, "quantity").text = str(s.quantity)
        etree.SubElement(n, "revenue").text = str(s.revenue)
        etree.SubElement(n, "status").text = s.status
        etree.SubElement(n, "sale_date").text = str(s.sale_date)

    xml_bytes = etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8")
    return StreamingResponse(iter([xml_bytes]), media_type="application/xml", headers={"Content-Disposition": "attachment; filename=sales.xml"})
