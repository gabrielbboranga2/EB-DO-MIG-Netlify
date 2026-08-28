import Image from 'next/image';

type BrandEmblemProps={
  size?:number;
  className?:string;
  decorative?:boolean;
  priority?:boolean;
};

export function BrandEmblem({size=52,className='',decorative=false,priority=false}:BrandEmblemProps){
  return <span className={`brand-emblem${className?` ${className}`:''}`} style={{width:size,height:size}}>
    <Image
      src="/brand/eb-do-mig-emblem-256.png"
      width={size}
      height={size}
      sizes={`${size}px`}
      alt={decorative?'':'Emblema EB DO MIG'}
      aria-hidden={decorative||undefined}
      priority={priority}
    />
  </span>;
}
