import googleG from "../../assets/marcas/google-g.webp";

export function GoogleIcon({ className = "size-5" }) {
  return (
    <img
      src={googleG}
      alt=""
      aria-hidden="true"
      width="200"
      height="204"
      draggable="false"
      className={`shrink-0 object-contain ${className}`.trim()}
    />
  );
}
