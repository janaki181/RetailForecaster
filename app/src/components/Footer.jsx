import { useEffect, useState } from "react";

function Footer() {
  const [footerMarkup, setFooterMarkup] = useState("");
  const xmlUrl = new URL("../footer.xml", import.meta.url);

  useEffect(() => {
    fetch(xmlUrl)
      .then((response) => response.text())
      .then((xmlText) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const parseError = xmlDoc.querySelector("parsererror");

        if (parseError || !xmlDoc.documentElement) {
          setFooterMarkup("");
          return;
        }

        const serializer = new XMLSerializer();
        const xmlMarkup = serializer.serializeToString(xmlDoc.documentElement);
        setFooterMarkup(xmlMarkup);
      })
      .catch(() => {
        setFooterMarkup("");
      });
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: footerMarkup }} />;
}

export default Footer;
