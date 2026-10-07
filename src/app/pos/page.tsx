"use client";

import { useState, useEffect, useRef } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingCart, 
  Loader2, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Wifi, 
  RefreshCw, 
  UserCheck, 
  Sparkles,
  Receipt,
  Store,
  QrCode,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useL2E, normaliseCardUid, formatNaira, nairaToKobo, type Service, type Student } from "@/lib/l2e";
import { toast } from "sonner";

interface CartItem {
  service: Service;
  quantity: number;
}

export default function PointOfSale() {
  const { services, students, subscribe, createService } = useL2E();
  
  // Cart state for multi-item supermarket/kiosk POS experience
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedQuickService, setSelectedQuickService] = useState<Service | null>(null);
  
  // Checkout & Card Scan state
  const [isScanningModalOpen, setIsScanningModalOpen] = useState(false);
  const [cardInput, setCardInput] = useState("");
  const [status, setStatus] = useState<"ready" | "processing" | "success" | "error">("ready");
  const [message, setMessage] = useState("");
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [lastOrderDetails, setLastOrderDetails] = useState<{ items: CartItem[]; total: number; student: Student } | null>(null);

  // New item quick creation modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [isCreatingService, setIsCreatingService] = useState(false);

  // Wedge scanner input ref
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep scanner input automatically focused when in ready scan state
  useEffect(() => {
    if (isScanningModalOpen && status === "ready") {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isScanningModalOpen, status]);

  // Support Web NFC API (NDEFReader) if running on Chrome Android or NFC-equipped POS device
  useEffect(() => {
    let ndefController: AbortController | null = null;

    if (isScanningModalOpen && status === "ready" && typeof window !== "undefined" && "NDEFReader" in window) {
      try {
        ndefController = new AbortController();
        const ndef = new (window as any).NDEFReader();
        ndef.scan({ signal: ndefController.signal }).then(() => {
          ndef.addEventListener("reading", (event: any) => {
            if (event.serialNumber) {
              processCardUid(event.serialNumber);
            }
          });
        }).catch((err: any) => {
          console.warn("Web NFC scan init failed or permission denied:", err);
        });
      } catch (err) {
        console.warn("Web NFC error:", err);
      }
    }

    return () => {
      if (ndefController) {
        ndefController.abort();
      }
    };
  }, [isScanningModalOpen, status]);

  // Cart operations
  const addToCart = (service: Service) => {
    setCart(prev => {
      const existing = prev.find(item => item.service.key === service.key);
      if (existing) {
        return prev.map(item => 
          item.service.key === service.key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
  };

  const removeFromCart = (serviceKey: string) => {
    setCart(prev => prev.filter(item => item.service.key !== serviceKey));
  };

  const updateQuantity = (serviceKey: string, delta: number) => {
    setCart(prev => 
      prev
        .map(item => {
          if (item.service.key === serviceKey) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalKobo = cart.reduce((sum, item) => sum + (item.service.monthly_kobo * item.quantity), 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Quick select single item
  const handleQuickPay = (service: Service) => {
    setCart([{ service, quantity: 1 }]);
    setIsScanningModalOpen(true);
    setStatus("ready");
    setMessage("");
    setScannedStudent(null);
    setCardInput("");
  };

  const openCheckout = () => {
    if (cart.length === 0) return;
    setIsScanningModalOpen(true);
    setStatus("ready");
    setMessage("");
    setScannedStudent(null);
    setCardInput("");
  };

  const processCardUid = (rawUid: string) => {
    const uid = normaliseCardUid(rawUid);
    if (!uid) return;

    setStatus("processing");
    
    // Look up student by card_uid or fallback to student ID / email match if typed
    const trimmedRaw = rawUid.trim().toLowerCase();
    const student = students.find(s => 
      s.card_uid === uid || 
      s.id.toLowerCase() === trimmedRaw ||
      s.full_name.toLowerCase() === trimmedRaw
    );

    setTimeout(async () => {
      if (!student) {
        setStatus("error");
        setMessage(`Unrecognized card or identifier "${uid}". No enrolled student found.`);
        setCardInput("");
        return;
      }

      if (student.status === "WITHDRAWN") {
        setStatus("error");
        setMessage(`Student ${student.full_name} (${student.id}) is withdrawn and cannot perform transactions.`);
        setCardInput("");
        return;
      }

      try {
        setScannedStudent(student);
        // Process subscription / charges for each item in cart
        for (const item of cart) {
          await subscribe(student.id, item.service.key);
        }

        setLastOrderDetails({
          items: [...cart],
          total: totalKobo,
          student,
        });

        setStatus("success");
        setMessage(`Payment of ${formatNaira(totalKobo)} processed successfully!`);
        setCardInput("");
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Payment authorization failed. Please try again.");
      }
    }, 450);
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardInput.trim()) return;
    processCardUid(cardInput);
  };

  const resetAfterSuccess = () => {
    setIsScanningModalOpen(false);
    setStatus("ready");
    setMessage("");
    setScannedStudent(null);
    setCardInput("");
    clearCart();
  };

  const handleQuickCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrice) return;
    const kobo = nairaToKobo(Number(newServicePrice));
    if (kobo <= 0) {
      toast.error("Please enter a valid price in Naira");
      return;
    }

    setIsCreatingService(true);
    try {
      const res = await createService({
        name: newServiceName.trim(),
        amount_kobo: kobo,
      });
      if (res.ok) {
        toast.success(`Created "${newServiceName.trim()}"`);
        setNewServiceName("");
        setNewServicePrice("");
        setCreateOpen(false);
      } else {
        toast.error(res.message || "Failed to create item");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create item");
    } finally {
      setIsCreatingService(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header - Supermarket / OPay / Square POS Style */}
      <header className="bg-[#0b2866] text-white px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-white shadow-inner">
            <Store className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white">TAP2PAY</span>
              <span className="bg-orange-500/20 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-400/30 uppercase tracking-widest">
                SMART POS
              </span>
            </div>
            <p className="text-xs text-blue-200">Campus Store, Kiosk & NFC Checkout</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#183980] hover:bg-[#20499e] text-white border border-blue-400/30">
                <Plus className="size-4 mr-1.5" /> Add New Item / Price
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#0b2866]">Create Item / Service</DialogTitle>
                <DialogDescription>
                  Instantly add a new product or service price to this POS catalogue.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleQuickCreateService} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Item / Service Name</Label>
                  <Input 
                    placeholder="e.g. Bottled Water, Daily Lunch, Gym Pass"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Price (₦ Naira)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-medium">₦</span>
                    <Input 
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="500"
                      className="pl-8 font-mono"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isCreatingService} className="bg-[#0b2866] hover:bg-[#153f93] text-white">
                    {isCreatingService ? "Saving..." : "Save to Catalogue"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 border-white/20 text-white" asChild>
            <a href="/dashboard">Exit POS</a>
          </Button>
        </div>
      </header>

      {/* Main Terminal Grid */}
      <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Product Catalogue / Items Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Tag className="size-4 text-[#0b2866]" /> Available Items & Services
              </h2>
              <p className="text-xs text-slate-500">Tap any item to add to bill, or use Quick Pay</p>
            </div>
            <span className="text-xs font-mono font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
              {services.filter(s => !s.archived).length} items
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {services.filter(s => !s.archived).map((svc) => {
              const inCartItem = cart.find(i => i.service.key === svc.key);
              return (
                <div
                  key={svc.key}
                  onClick={() => addToCart(svc)}
                  role="button"
                  tabIndex={0}
                  className={`group relative bg-white rounded-2xl border-2 p-4 text-left transition-all duration-150 hover:shadow-md cursor-pointer flex flex-col justify-between select-none ${
                    inCartItem 
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10' 
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {inCartItem && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white size-6 rounded-full text-xs font-bold flex items-center justify-center shadow">
                      {inCartItem.quantity}
                    </span>
                  )}
                  <div>
                    <div className="size-9 rounded-xl bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 text-slate-600 flex items-center justify-center mb-3 transition-colors">
                      <CreditCard className="size-4" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug">
                      {svc.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                      {svc.key}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono font-extrabold text-slate-900 text-base">
                      {formatNaira(svc.monthly_kobo)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickPay(svc);
                      }}
                      className="text-[11px] bg-slate-100 hover:bg-orange-500 hover:text-white font-medium text-slate-700 px-2 py-1 rounded transition-colors"
                      title="Direct tap-to-pay for just this item"
                    >
                      Instant Tap
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Smart POS Register & Cart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            
            {/* Register Top Banner */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="size-5 text-orange-400" />
                <div>
                  <h2 className="font-bold text-base tracking-wide">Current Order</h2>
                  <p className="text-xs text-slate-400">{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in bill</p>
                </div>
              </div>
              {cart.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCart} 
                  className="text-slate-400 hover:text-red-400 hover:bg-white/10 text-xs h-8 px-2"
                >
                  <Trash2 className="size-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-4 overflow-y-auto min-h-[260px] max-h-[380px] divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <ShoppingCart className="size-12 mb-3 text-slate-300 stroke-[1.5]" />
                  <p className="font-medium text-slate-600">No items selected</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                    Tap items on the left to add them to this order
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.service.key} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{item.service.name}</p>
                      <p className="font-mono text-xs text-slate-500">
                        {formatNaira(item.service.monthly_kobo)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button 
                          onClick={() => updateQuantity(item.service.key, -1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="px-2 font-mono text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.service.key, 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <div className="text-right w-20">
                        <p className="font-mono font-bold text-sm text-slate-900">
                          {formatNaira(item.service.monthly_kobo * item.quantity)}
                        </p>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.service.key)} 
                        className="text-slate-400 hover:text-red-500 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill Summary & Tap Pay Action */}
            <div className="bg-slate-50 p-5 border-t border-slate-200 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatNaira(totalKobo)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Tax & Campus Levy</span>
                  <span className="font-mono">₦0.00</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-extrabold text-slate-900 text-base">Total Due</span>
                  <span className="font-mono font-black text-2xl text-[#0b2866]">
                    {formatNaira(totalKobo)}
                  </span>
                </div>
              </div>

              {/* Big POS Action Button (ApplePay / OPay Style) */}
              <Button
                onClick={openCheckout}
                disabled={cart.length === 0}
                className="w-full h-14 bg-[#0b2866] hover:bg-[#153f93] text-white font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-3"
              >
                <CreditCard className="size-6" />
                Tap Student NFC Card
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* APPLE PAY / OPAY STYLE NFC CARD TAP DIALOG */}
      <Dialog 
        open={isScanningModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsScanningModalOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-0 overflow-hidden rounded-3xl shadow-2xl">
          
          {/* Header styling */}
          <div className="bg-[#0b2866] px-6 py-5 text-white text-center relative">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-blue-200">Payment Terminal</h3>
            <p className="text-2xl font-black font-mono mt-1 text-white">{formatNaira(totalKobo)}</p>
            <p className="text-xs text-blue-300 mt-0.5">
              {cart.map(c => `${c.quantity}x ${c.service.name}`).join(", ")}
            </p>
          </div>

          <div className="p-6">
            {status === "ready" && (
              <div className="flex flex-col items-center text-center space-y-4">
                
                {/* Modern Apple Pay / Contactless Pulsing Animation */}
                <div className="relative my-2">
                  <div className="size-32 rounded-full bg-blue-50 border-8 border-blue-100 flex items-center justify-center shadow-inner animate-pulse">
                    <Wifi className="size-14 text-blue-600 rotate-90" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white border-2 border-blue-500 rounded-full p-1.5 shadow">
                    <CreditCard className="size-5 text-blue-600" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-slate-900">Hold Card Near Reader</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                    Tap student NFC smart card or tag on the terminal or scanner to authorize payment.
                  </p>
                </div>

                {/* Hidden autofocus input for USB Wedge / Barcode / NFC scanner */}
                <form onSubmit={handleManualScanSubmit} className="w-full">
                  <input
                    ref={inputRef}
                    type="text"
                    value={cardInput}
                    onChange={(e) => setCardInput(e.target.value)}
                    autoFocus
                    autoComplete="off"
                    className="opacity-0 absolute -z-50"
                  />
                  
                  {/* Visual input for manual Student ID or Email fallback if scanner disconnected */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Or enter Student ID / Email address manually:</p>
                    <div className="flex gap-2">
                      <Input
                        value={cardInput}
                        onChange={(e) => setCardInput(e.target.value)}
                        placeholder="e.g. CARD UID or L2E-1001"
                        className="font-mono text-sm border-slate-300"
                      />
                      <Button 
                        type="submit" 
                        disabled={!cardInput.trim()} 
                        className="bg-[#0b2866] hover:bg-[#153f93] text-white"
                      >
                        Authorize
                      </Button>
                    </div>
                  </div>
                </form>

              </div>
            )}

            {status === "processing" && (
              <div className="py-8 flex flex-col items-center text-center space-y-4">
                <div className="size-20 rounded-full bg-blue-50 flex items-center justify-center">
                  <Loader2 className="size-10 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">Reading NFC Card...</h4>
                  <p className="text-sm text-slate-500 mt-1">Verifying student account and balance with backend</p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="py-4 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="size-20 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center text-green-600 shadow-sm">
                  <CheckCircle2 className="size-12" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900">Payment Approved</h4>
                  <p className="text-sm text-green-700 font-medium mt-1">{message}</p>
                </div>

                {scannedStudent && (
                  <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Cardholder</span>
                      <span className="font-bold text-slate-900 text-sm">{scannedStudent.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student ID</span>
                      <span className="font-mono font-bold text-slate-700">{scannedStudent.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Card UID</span>
                      <span className="font-mono text-slate-700">{scannedStudent.card_uid}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-medium">
                      <span className="text-slate-500">Total Deducted</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">{formatNaira(totalKobo)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={resetAfterSuccess} 
                  className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl mt-4"
                >
                  Done / Next Customer
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="py-4 flex flex-col items-center text-center space-y-4 animate-in shake duration-200">
                <div className="size-20 rounded-full bg-red-100 border-4 border-red-200 flex items-center justify-center text-red-600 shadow-sm">
                  <AlertCircle className="size-12" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Payment Declined</h4>
                  <p className="text-sm text-red-600 font-medium mt-1 max-w-xs mx-auto">{message}</p>
                </div>

                <div className="w-full flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsScanningModalOpen(false)} 
                    className="flex-1 border-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setStatus("ready");
                      setMessage("");
                      setCardInput("");
                    }} 
                    className="flex-1 bg-[#0b2866] hover:bg-[#153f93] text-white"
                  >
                    Try Tap Again
                  </Button>
                </div>
              </div>
            )}

          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}
