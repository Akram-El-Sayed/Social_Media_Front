import React from 'react'
import { FiUser } from "react-icons/fi";

export default function AvatarImg({ src, alt, className, style = {}, onClick }) {
  return (
    <>
     {src ? (
    <img src={src} alt={alt} className={className} style={style} onClick={onClick} loading="lazy" />
  ) : (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--color-background-secondary)", ...style }}
      onClick={onClick}
    >
      <FiUser size={20} className="text-secondary" />
    </span>

  )}
  </>
  )
}


 