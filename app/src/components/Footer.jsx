import { useEffect, useState } from "react";

const mapTagToElement = (node, doc) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tag = node.tagName.toLowerCase();
  let el;

  switch (tag) {
    case "layout":
      el = doc.createElement("div");
      break;
    case "footer":
      el = doc.createElement("footer");
      break;
    case "container":
      el = doc.createElement("div");
      break;
    case "footerbrand":
      el = doc.createElement("div");
      el.className = "footer-brand";
      break;
    case "logo":
      el = doc.createElement("div");
      el.className = "logo";
      break;
    case "icon":
      el = doc.createElement("span");
      el.className = "logo-icon";
      break;
    case "text":
      el = doc.createElement("span");
      el.className = "logo-text";
      break;
    case "tagline":
      el = doc.createElement("p");
      el.className = "footer-tagline";
      break;
    case "footerlinks":
      el = doc.createElement("div");
      el.className = "footer-links";
      break;
    case "column":
      el = doc.createElement("div");
      el.className = "footer-column";
      break;
    case "heading":
      el = doc.createElement("h4");
      break;
    case "link":
      el = doc.createElement("a");
      el.setAttribute("href", node.getAttribute("href") || "#");
      break;
    case "email":
    case "phone":
    case "location":
      el = doc.createElement("p");
      el.className = "footer-text";
      break;
    case "footerbottom":
      el = doc.createElement("div");
      el.className = "footer-bottom";
      break;
    case "copyright":
      el = doc.createElement("p");
      break;
    default:
      el = doc.createElement("div");
  }

  if (node.attributes) {
    Array.from(node.attributes).forEach((attr) => {
      if (attr.name === "class" && !el.className) {
        el.className = attr.value;
      } else if (attr.name === "id") {
        el.setAttribute("id", attr.value);
      }
    });
  }

  Array.from(node.childNodes).forEach((child) => {
    const mapped = mapTagToElement(child, doc);
    if (mapped) {
      el.appendChild(mapped);
    }
  });

  return el;
};

function Footer() {
  const [footerMarkup, setFooterMarkup] = useState("");

  useEffect(() => {
    fetch("/footer.xml")
      .then((response) => response.text())
      .then((xmlText) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const parseError = xmlDoc.querySelector("parsererror");

        if (parseError) {
          setFooterMarkup("");
          return;
        }

        const container = document.createElement("div");
        const mappedRoot = mapTagToElement(xmlDoc.documentElement, document);
        if (mappedRoot) {
          container.appendChild(mappedRoot);
        }

        setFooterMarkup(container.innerHTML);
      })
      .catch(() => {
        setFooterMarkup("");
      });
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: footerMarkup }} />;
}

export default Footer;
