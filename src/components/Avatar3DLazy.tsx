"use client";

import dynamic from "next/dynamic";

// Loads three.js only once a page actually shows a 3D avatar, after the rest of the page is already visible.
const Avatar3DLazy = dynamic(() => import("./Avatar3D"), { ssr: false });

export default Avatar3DLazy;
