import { useState } from 'react';
import { Mascote } from './mascote/index.js';

function Foto({ fotoUrl, className }) {
  const [falhou, setFalhou] = useState(false);
  return !falhou && fotoUrl ? <img className={className} src={fotoUrl} alt="" draggable="false" onError={() => setFalhou(true)} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : <Mascote pose="boas_vindas" tamanho="full" decorativo className={className} />;
}

export function AvatarPerfil({ fotoUrl, className = '' }) {
  return <Foto key={fotoUrl || 'sem-foto'} fotoUrl={fotoUrl} className={className} />;
}
