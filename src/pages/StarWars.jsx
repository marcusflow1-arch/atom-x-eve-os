import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import KejimPostMapRuntime from '@/components/starwars/KejimPostMapRuntime';

export default function StarWars(){
  const navigate=useNavigate();
  return <main className="fixed inset-0 z-[200000] overflow-hidden bg-black">
    <KejimPostMapRuntime />
  </main>;
}
