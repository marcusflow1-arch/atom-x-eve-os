import React from 'react';
import KejimPostMapRuntime from '@/components/starwars/KejimPostMapRuntime';

export default function StarWars(){
  return <main className="fixed inset-0 z-[200000] overflow-hidden bg-black">
    <KejimPostMapRuntime />
  </main>;
}
