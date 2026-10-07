"use client";

import { useState, useEffect, useRef } from "react";
import { CreditCard, CheckCircle2, AlertCircle, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/l2e/ui";
import { useL2E, normaliseCardUid, formatNaira, type Service, type Student } from "@/lib/l2e";

export default function PointOfSale() {
  const { services, students, subscribe } = useL2E();
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [cardInput, setCardInput] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input focused so wedge scanner works seamlessly
  useEffect(() => {
    if (selectedService && status === "idle") {
      inputRef.current?.focus();
    }
  }, [selectedService, status]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !cardInput) return;
    
    setStatus("processing");
    const uid = normaliseCardUid(cardInput);
    const student = students.find(s => s.card_uid === uid);
    
    setTimeout(() => {
      if (student) {
        if (student.status === "WITHDRAWN") {
          setStatus("error");
          setMessage(`Student ${student.full_name} is withdrawn and cannot make purchases.`);
          setCardInput("");
        } else {
          setScannedStudent(student);
          subscribe(student.id, selectedService.key);
          setStatus("success");
          setMessage(`Successfully charged ${student.full_name} for ${selectedService.name}.`);
          setCardInput("");
        }
      } else {
        setStatus("error");
        setMessage(`Unknown card UID: ${uid}. No student found.`);
        setCardInput("");
      }
    }, 800); // simulate brief processing delay
  };

  const reset = () => {
    setStatus("idle");
    setMessage("");
    setScannedStudent(null);
    setCardInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Tap2Pay Kiosk" sub="Select a service, then tap a student card to charge their account." />
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-[#0b2866] flex items-center gap-2">
            <ShoppingCart className="size-5" /> 1. Select Item
          </h2>
          <div className="grid gap-3">
            {services.filter(s => !s.archived).map(s => (
              <button 
                key={s.key}
                onClick={() => { setSelectedService(s); reset(); }}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${selectedService?.key === s.key ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}`}
              >
                <div>
                  <p className="font-semibold text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">{s.key}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900">{formatNaira(s.monthly_kobo)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-[#0b2866] flex items-center gap-2">
            <CreditCard className="size-5" /> 2. Tap Card
          </h2>
          
          <Panel className="border-slate-200 shadow-sm bg-white overflow-hidden min-h-[300px] flex flex-col items-center justify-center relative p-8">
            {!selectedService ? (
              <div className="text-center text-slate-400">
                <ShoppingCart className="size-12 mx-auto mb-3 opacity-20" />
                <p>Select an item first to begin scanning.</p>
              </div>
            ) : status === "idle" ? (
              <div className="text-center w-full max-w-sm">
                <div className="size-24 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center mx-auto mb-6 pulse-dot">
                  <CreditCard className="size-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Scan</h3>
                <p className="text-sm text-slate-500 mb-6">Waiting for card tap to charge <strong className="text-slate-700">{formatNaira(selectedService.monthly_kobo)}</strong> for {selectedService.name}...</p>
                
                <form onSubmit={handleScan} className="opacity-0 absolute -z-10">
                  <Input 
                    ref={inputRef}
                    value={cardInput}
                    onChange={(e) => setCardInput(e.target.value)}
                    autoFocus
                    autoComplete="off"
                  />
                  <button type="submit">Submit</button>
                </form>
                
                {/* Fallback for manual entry if scanner doesn't send Enter */}
                <div className="mt-4 border-t border-slate-100 pt-4 flex gap-2">
                  <Input 
                    value={cardInput}
                    onChange={(e) => setCardInput(e.target.value)}
                    placeholder="Or enter UID manually..." 
                    className="font-mono text-sm border-slate-200"
                  />
                  <Button onClick={handleScan} disabled={!cardInput} className="bg-[#0b2866] hover:bg-[#153f93]">Charge</Button>
                </div>
              </div>
            ) : status === "processing" ? (
              <div className="text-center text-slate-500">
                <Loader2 className="size-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p>Processing payment for {cardInput}...</p>
              </div>
            ) : status === "success" ? (
              <div className="text-center w-full animate-in zoom-in duration-300">
                <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="size-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Accepted</h3>
                <p className="text-slate-600">{message}</p>
                {scannedStudent && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-left">
                    <p className="text-slate-500 mb-1">Student</p>
                    <p className="font-semibold text-slate-900 text-lg">{scannedStudent.full_name}</p>
                    <p className="font-mono text-slate-500">{scannedStudent.id}</p>
                  </div>
                )}
                <Button onClick={reset} className="mt-8 bg-slate-800 w-full" size="lg">Ready for next customer</Button>
              </div>
            ) : (
              <div className="text-center w-full animate-in shake duration-300">
                <div className="size-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="size-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h3>
                <p className="text-red-600">{message}</p>
                <Button onClick={reset} variant="outline" className="mt-8 w-full border-slate-200" size="lg">Try Again</Button>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
