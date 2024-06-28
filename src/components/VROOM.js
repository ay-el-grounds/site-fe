import React from 'react';
import IconSvg from '../../public/SVG/vroom-logo-wht.svg'; // adjust the path as necessary

const VROOM = ({ fill = 'black', width = 500, height = 'auto' }) => (
  <IconSvg style={{ fill: fill, width: width, height: height }} />
);

export default VROOM;