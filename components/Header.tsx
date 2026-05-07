import Image from "next/image";

export default function Header() {
  return (
    <header className="relative -mx-4 -mt-6 overflow-hidden md:-mx-8 lg:-mx-10">
      <div className="relative h-[260px] w-full md:h-[340px] lg:h-[420px]">
        <Image
          src="/banner-header.png"
          alt="PalmGrade AI Automated FFB Grading System Banner"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#f6faf7]" />
      </div>
    </header>
  );
}