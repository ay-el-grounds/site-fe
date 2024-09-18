import React from "react";
import IconSvg from "../../public/SVG/lettermark.svg";
import Link from "next/link";

const AG = ({ fill = "black", width = 500, height = "auto" }) => (
  <Link href="/">
    <IconSvg style={{ fill: fill, width: width, height: height }} />
  </Link>
);

export default AG;
