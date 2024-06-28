import React from 'react';
import IconSvg from '../../public/SVG/lettermark.svg'; // adjust the path as necessary

const AG = ({ fill = 'black', width = 500, height = 'auto' }) => (
  <IconSvg style={{ fill: fill, width: width, height: height }} />
);

export default AG;