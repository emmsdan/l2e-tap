"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useL2E, formatNaira, type Service, type Student } from "@/lib/l2e";

export default function StudentPortal() {
  const { students, services, subscribe } = useL2E();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState("");
  
  const [selectedServiceKey, setSelectedServiceKey] = useState<string>("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!studentIdInput.trim()) return;
    
    const found = students.find(s => s.id.toLowerCase() === studentIdInput.toLowerCase().trim());
    if (found) {
      if (found.status === "WITHDRAWN") {
        setError("This account has been withdrawn.");
      } else {
        setStudent(found);
        setStep(2);
      }
    } else {
      setError("Student ID not found. Please try again.");
    }
  };

  const handleSubscribe = async () => {
    if (!student || !selectedServiceKey) return;
    await subscribe(student.id, selectedServiceKey);
    setStep(3);
  };
  
  const selectedService = services.find(s => s.key === selectedServiceKey);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <div className="grid size-10 place-items-center bg-[#183980] rounded-lg text-xs font-bold tracking-tight">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 20L20 10V30L10 20Z" fill="white" />
            <path d="M30 20L20 10V30L30 20Z" fill="white" />
          </svg>
        </div>
        <div className="leading-none flex flex-col">
          <span className="text-lg font-bold font-sans tracking-tight text-[#0b2866]">LEARN2EARN</span>
          <span className="text-sm font-medium font-sans tracking-tight text-slate-500 mt-0.5">Student Portal</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
        
        {step === 1 && (
          <div className="w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-800">Welcome to Tap2Pay</h1>
              <p className="text-slate-500 mt-2">Enter your Student ID to manage your subscriptions.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Student ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-5 text-slate-400" />
                  <Input 
                    value={studentIdInput} 
                    onChange={e => setStudentIdInput(e.target.value)} 
                    placeholder="e.g. L2E-1001" 
                    className="pl-10 h-12 text-lg font-mono border-slate-300"
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-600 font-medium mt-2">{error}</p>}
              </div>
              <Button type="submit" className="w-full h-12 text-base bg-[#0b2866] hover:bg-[#153f93]">
                Continue <ChevronRight className="size-4 ml-1" />
              </Button>
            </form>
          </div>
        )}

        {step === 2 && student && (
          <div className="w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Select a Service</h1>
                <p className="text-slate-500 mt-1">Hello, {student.full_name}</p>
              </div>
              <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-500">Not you?</Button>
            </div>

            <RadioGroup value={selectedServiceKey} onValueChange={setSelectedServiceKey} className="gap-4">
              {services.filter(s => !s.archived).map(s => (
                <label 
                  key={s.key} 
                  className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedServiceKey === s.key ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value={s.key} className="size-5" />
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{s.name}</p>
                      <p className="text-slate-500 text-sm">Monthly deduction via Pebbles</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900 text-lg">{formatNaira(s.monthly_kobo)}</p>
                    <p className="text-slate-400 text-xs">/ month</p>
                  </div>
                </label>
              ))}
            </RadioGroup>

            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="h-12 w-1/3">Back</Button>
              <Button onClick={handleSubscribe} disabled={!selectedServiceKey} className="h-12 flex-1 bg-[#0b2866] hover:bg-[#153f93] text-base">
                Confirm Subscription
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center animate-in zoom-in duration-300">
            <div className="size-24 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="size-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Submitted!</h2>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto">
              Your request for <b>{selectedService?.name}</b> has been queued. Your access will be granted automatically as soon as Pebbles confirms the payroll deduction.
            </p>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-8 text-left text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Student</span>
                <span className="font-medium text-slate-900">{student?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-medium text-slate-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deduction</span>
                <span className="font-mono font-medium text-slate-900">{selectedService ? formatNaira(selectedService.monthly_kobo) : ""}</span>
              </div>
            </div>

            <Button onClick={() => {
              setStep(1);
              setStudentIdInput("");
              setStudent(null);
              setSelectedServiceKey("");
            }} className="w-full h-12 bg-slate-800 text-base">Done</Button>
          </div>
        )}
      </main>
    </div>
  );
}
