import React from 'react';

export default function GameplayAndCollectibles() {
  return (
    <div className="space-y-4">
      {/* Gameplay */}
      <div className="bg-[#455a64] p-4 bevel-light">
        <h3 className="text-xl mb-2">Gameplay</h3>
        <div className="grid grid-cols-12 items-center gap-2">
          <div className="text-center text-2xl">{`<`}</div>
          <div className="col-span-10 h-32 bg-[#2c3e50] bevel-dark"></div>
          <div className="text-center text-2xl">{`>`}</div>
        </div>
      </div>

      {/* Exclusives Banner */}
      <div className="text-center font-bold text-2xl tracking-[0.2em]">
        <h2 className="text-gray-400">EXCLUSIVES <span className="text-yellow-400">GAMEPLAY</span></h2>
        <h3 className="text-yellow-400">EDITOR CHOICE</h3>
      </div>
      <div className="border-b-2 border-t-2 border-[#546e7a] my-2 h-1"></div>

      {/* Carousel */}
       <div className="grid grid-cols-12 items-center gap-2">
          <div className="text-center text-2xl">{`<`}</div>
          <div className="col-span-5 h-32 bg-[#2c3e50] bevel-dark"></div>
          <div className="col-span-5 h-32 bg-[#2c3e50] bevel-dark"></div>
          <div className="text-center text-2xl">{`>`}</div>
      </div>

      {/* Achievement News */}
      <div className="bg-[#455a64] p-4 bevel-light mt-4">
        <h3 className="text-xl mb-2">Achievement News or Collectables</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-[#2c3e50] bevel-dark"></div>
          <div className="h-64 bg-[#2c3e50] bevel-dark"></div>
        </div>
         <div className="relative mx-auto w-1/2 h-20 bg-[#2c3e50] bevel-dark mt-[-2rem] border-4 border-[#34495e]"></div>
      </div>
    </div>
  );
}