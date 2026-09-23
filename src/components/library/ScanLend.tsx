'use client';

import React, { useState } from 'react';
import { Scan, User, Book, CheckCircle, RotateCcw, QrCode } from 'lucide-react';
import { Book as BookType, User as UserType, LibraryBorrowing } from '@/utils/storage';
import { getBooksAction, getUsersAction, updateBookAction, addLibraryBorrowingAction, updateLibraryBorrowingAction, getLibraryBorrowingsAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BarcodeScanner from './BarcodeScanner';


export default function ScanLend() {
  const [bookBarcode, setBookBarcode] = useState('');
  const [bookInfo, setBookInfo] = useState<BookType | null>(null);
  const [userUSN, setUserUSN] = useState('');
  const [userInfo, setUserInfo] = useState<UserType | null>(null);
  const [daysUntilDue, setDaysUntilDue] = useState('7');
  const [step, setStep] = useState<'scan' | 'user' | 'confirm'>('scan');
  const [mode, setMode] = useState<'lend' | 'return'>('lend');
  const [showScanner, setShowScanner] = useState(false);

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    if (step === 'scan') {
      setBookBarcode(result);
      scanBook(result);
    } else if (step === 'user') {
      setUserUSN(result);
      findUser(result);
    }
  }

  const scanBook = async (barcode: string) => {
    if (!barcode.trim()) {
      toast.error('Please enter a book barcode');
      return;
    }

    try {
      const books = await getBooksAction();
      const book = books.find((b: any) => b.barcode === barcode);

      if (!book) {
        toast.error('Book not found!');
        return;
      }

      if (mode === 'lend' && book.status === 'borrowed') {
        toast.warning('This book is currently borrowed!', { description: `Borrowed by ${book.borrowerId}` });
        return;
      }

      if (mode === 'return' && book.status !== 'borrowed') {
        toast.warning('This book is not currently borrowed!');
        return;
      }

      setBookInfo(book);
      toast.success("Book found: " + book.title);
      
      if (mode === 'return') {
        const users = await getUsersAction();
        const borrowerInfo = users.find(u => u.id === book.borrowerId);
        if (borrowerInfo) {
          setUserInfo(borrowerInfo);
          setStep('confirm');
        } else {
          setStep('user');
        }
      } else {
        setStep('user');
      }
    } catch (e) {
      toast.error("Error finding book.");
    }
  };

  const findUser = async (usn: string) => {
    if (!usn.trim()) {
      toast.error('Please enter a USN/EMP ID');
      return;
    }
    
    try {
        const users = await getUsersAction();
        const user = users.find((u: any) => u.id === usn.trim());

        if (!user) {
        toast.error('User not found!');
        return;
        }

        setUserInfo(user);
        setStep('confirm');
        toast.success("Identity Verified: " + user.name);
    } catch(e) {
        toast.error("Error finding user.");
    }
  };
  
  const confirmLending = async () => {
    if (!bookInfo || !userInfo) return;

    try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(daysUntilDue || '7'));

        await updateBookAction(bookInfo.id, {
            status: 'borrowed',
            borrowerId: userInfo.id,
            borrowedAt: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
        });
        
        await addLibraryBorrowingAction({
            bookId: bookInfo.id,
            studentId: userInfo.id,
            borrowDate: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
            status: 'borrowed'
        });

        toast.success(`Book lent to ${userInfo.name}!`, { description: `Due on ${dueDate.toLocaleDateString()}`});
        reset();
    } catch(e) {
        toast.error("Failed to lend book.");
    }
  };

  const handleReturn = async () => {
    if (!bookInfo) return;

    try {
      await updateBookAction(bookInfo.id, {
        status: 'available',
        borrowerId: undefined,
        borrowedAt: undefined,
        dueDate: undefined,
      });

      const borrowings = await getLibraryBorrowingsAction();
      const record = borrowings.slice().reverse().find(
        (r: LibraryBorrowing) => r.bookId === bookInfo.id && !r.returnDate
      );
      
      if (record) {
        await updateLibraryBorrowingAction(record.id, {
            returnDate: new Date().toISOString(),
            status: 'returned'
        });
      }
      
      toast.success(`Book "${bookInfo.title}" returned successfully!`);
      reset();
    } catch(e) {
      toast.error("Failed to return book.");
    }
  };

  const reset = () => {
    setBookBarcode('');
    setBookInfo(null);
    setUserUSN('');
    setUserInfo(null);
    setDaysUntilDue('7');
    setStep('scan');
    setShowScanner(false);
  };
  
  const getStepClass = (currentStep: string, thisStep: string) => {
    if (currentStep === thisStep) return 'bg-primary text-white';
    if (thisStep === 'scan' && bookInfo) return 'bg-green-500 text-white';
    if (thisStep === 'user' && userInfo) return 'bg-green-500 text-white';
    return 'bg-gray-300 text-gray-600';
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">Library Transaction</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Scan QR ID or Barcodes to process</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button onClick={() => { setMode('lend'); reset(); }} variant={mode === 'lend' ? 'default' : 'secondary'} className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest gap-2">
            Lend Book
          </Button>
          <Button onClick={() => { setMode('return'); reset(); }} variant={mode === 'return' ? 'default' : 'secondary'} className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest gap-2">
            Return Book
          </Button>
        </div>
      </div>

      {showScanner && <BarcodeScanner onScan={handleScanResult} onCancel={() => setShowScanner(false)} />}

      {!showScanner && <div className="bg-white rounded-[2.5rem] shadow-xl p-8 max-w-2xl border-primary/5">
        {/* Step 1: Scan Book */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg transition-all ${getStepClass(step, 'scan')}`}>1</div>
            <h3 className="text-xl font-black uppercase tracking-tight">Scan Book Barcode</h3>
          </div>

          <div className="ml-14 space-y-4">
            {!bookInfo ? (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={bookBarcode}
                  onChange={(e) => setBookBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && scanBook(e.currentTarget.value)}
                  placeholder="Scan or enter barcode..."
                  disabled={step !== 'scan'}
                  className="h-14 rounded-2xl border-primary/10 font-bold px-6"
                />
                <Button onClick={() => setShowScanner(true)} disabled={step !== 'scan'} className="h-14 w-14 rounded-2xl shadow-lg"><Scan size={24} /></Button>
              </div>
            ) : (
              <div className="p-6 bg-green-50 border-2 border-green-100 rounded-[1.5rem] animate-in zoom-in duration-300">
                <div className="flex items-center gap-2 mb-2"><CheckCircle size={20} className="text-green-600" /><span className="text-green-900 font-black uppercase text-xs tracking-widest">Book Verified</span></div>
                <p className="font-black text-green-800 text-lg uppercase leading-tight">{bookInfo.title}</p>
                <p className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest mt-1">Barcode: {bookInfo.barcode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Find User */}
        {mode === 'lend' && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg transition-all ${getStepClass(step, 'user')}`}>2</div>
              <h3 className="text-xl font-black uppercase tracking-tight">Scan Student QR ID</h3>
            </div>

            <div className="ml-14 space-y-4">
              {!userInfo ? (
                <div className="flex gap-2">
                  <Input type="text" value={userUSN} onChange={(e) => setUserUSN(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && findUser(e.currentTarget.value)} placeholder="Scan student QR..." disabled={step !== 'user'} className="h-14 rounded-2xl border-primary/10 font-bold px-6"/>
                  <Button onClick={() => setShowScanner(true)} disabled={step !== 'user'} className="h-14 w-14 rounded-2xl shadow-lg bg-primary"><QrCode size={24} /></Button>
                </div>
              ) : (
                <div className="p-6 bg-green-50 border-2 border-green-100 rounded-[1.5rem] animate-in zoom-in duration-300">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle size={20} className="text-green-600" /><span className="text-green-900 font-black uppercase text-xs tracking-widest">Student Identity Verified</span></div>
                  <p className="font-black text-green-800 text-lg uppercase leading-tight">{userInfo.name}</p>
                  <p className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest mt-1">ID: {userInfo.id}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg bg-primary text-white`}>{mode === 'lend' ? '3' : '2'}</div>
              <h3 className="text-xl font-black uppercase tracking-tight">{mode === 'lend' ? 'Finalize & Set Due Date' : 'Confirm Return'}</h3>
            </div>

            <div className="ml-14 space-y-4">
              {mode === 'lend' ? (
                <div className="space-y-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Days Until Return</Label>
                    <Input type="number" value={daysUntilDue} onChange={(e) => setDaysUntilDue(e.target.value)} min="1" className="h-14 rounded-2xl border-primary/10 font-black text-xl px-6 mt-2" />
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-3">Scheduled Return: {new Date(Date.now() + parseInt(daysUntilDue || '7') * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={confirmLending} className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 gap-2"><CheckCircle size={20} />Confirm Lend</Button>
                    <Button onClick={reset} variant="ghost" className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                    <div className="p-6 bg-primary/5 border-2 border-primary/10 rounded-[1.5rem] space-y-3">
                        <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Returning Item</p>
                          <p className="font-black text-primary uppercase">{bookInfo?.title}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Borrowed By</p>
                          <p className="font-black text-foreground uppercase">{userInfo?.name} ({userInfo?.id})</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleReturn} className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 gap-2"><CheckCircle size={20} />Confirm Return</Button>
                        <Button onClick={reset} variant="ghost" className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</Button>
                    </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(bookInfo || userInfo) && (
          <Button onClick={reset} variant="ghost" className="w-full mt-6 gap-2 text-muted-foreground font-black uppercase text-[10px] tracking-widest"><RotateCcw size={14}/>Start New Transaction</Button>
        )}
      </div>}
    </div>
  );
}
