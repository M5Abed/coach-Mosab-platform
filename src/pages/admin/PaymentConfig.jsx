import React, { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { toast } from '../../store/toastStore'
import { Plus, ToggleLeft, ToggleRight, Save, Trash2 } from 'lucide-react'

export function PaymentConfig() {
  const [methods, setMethods] = useState([
    { id: 1, name: 'Instapay', accountName: 'Mosab El-Sayed', number: 'mosabel@instapay', active: true },
    { id: 2, name: 'Vodafone Cash', accountName: 'Ahmed Mohamed', number: '01023456789', active: true },
    { id: 3, name: 'Orange Money', accountName: 'Ahmed Mohamed', number: '01234567890', active: false }
  ])

  const [newMethodName, setNewMethodName] = useState('Instapay')
  const [newAccountName, setNewAccountName] = useState('')
  const [newNumber, setNewNumber] = useState('')

  const handleToggle = (id) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m))
    toast.success('Payment method active status updated!')
  }

  const handleDelete = (id) => {
    setMethods(prev => prev.filter(m => m.id !== id))
    toast.success('Payment method deleted successfully.')
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newAccountName || !newNumber) {
      toast.error('Please fill in all configuration fields.')
      return
    }

    const newMethod = {
      id: Date.now(),
      name: newMethodName,
      accountName: newAccountName,
      number: newNumber,
      active: true
    }

    setMethods([...methods, newMethod])
    setNewAccountName('')
    setNewNumber('')
    toast.success('New manual payment channel added!')
  }

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Header */}
      <div>
        <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
          PAYMENT SETTINGS & ACCOUNTS
        </h1>
        <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
          Configure mobile wallets and Instapay addresses displayed on checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Configuration list */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">ACTIVE CHANNELS</h3>
          
          {methods.map((m) => (
            <Card key={m.id} className="p-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bebas text-lg text-[#F5F5F5] tracking-wide">{m.name}</h4>
                  <Badge variant={m.active ? 'active' : 'expired'}>{m.active ? 'Active' : 'Disabled'}</Badge>
                </div>
                <div className="text-xs text-[#666666] font-semibold">
                  <p>Holder: {m.accountName}</p>
                  <p className="font-mono text-sm text-[#F5F5F5] mt-1">{m.number}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(m.id)}
                  className="text-[#666666] hover:text-[#E8FF00] transition-colors cursor-pointer outline-none"
                >
                  {m.active ? <ToggleRight size={32} className="text-[#E8FF00]" /> : <ToggleLeft size={32} />}
                </button>
                
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-2 rounded hover:bg-[#1C1C1C] text-[#666666] hover:text-[#FF3A2D] transition-colors cursor-pointer outline-none"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Right Side: Add channel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-2">ADD CHANNEL</h3>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Wallet Brand / Provider</label>
                <select
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                >
                  <option value="Instapay">Instapay</option>
                  <option value="Vodafone Cash">Vodafone Cash</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Etisalat Cash">Etisalat Cash</option>
                  <option value="WE Pay">WE Pay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ahmed Mohamed"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Wallet Number / Address</label>
                <input
                  type="text"
                  placeholder="e.g. 010XXXXXXXX or VPA"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <Button type="submit" className="w-full font-bebas uppercase tracking-wider text-base py-3">
                <Plus size={16} className="mr-1" /> Add Payment Method
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PaymentConfig
