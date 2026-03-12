'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient';// Go up two levels (out of 'app', out of 'src') to find 'lib'
// This points to the file we just fixed

export default function Home() {
  const [wards, setWards] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      console.log("Attempting to fetch wards...")
      
      // Fetch the wards we created in Phase 1
      const { data, error } = await supabase.from('wards').select('*')
      
      if (error) {
        console.error("Error fetching:", error)
        setError(error.message)
      } else {
        console.log("Success:", data)
        setWards(data || [])
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-10 font-sans text-white bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-green-400">AeroWard Connection Test</h1>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 p-4 rounded mb-4 text-red-200">
          ❌ Error: {error}
        </div>
      )}
      
      {wards.length === 0 && !error ? (
        <p className="animate-pulse">Loading database data...</p>
      ) : (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">✅ Connected! Found these Wards:</h2>
          <ul className="list-disc pl-5 space-y-2">
            {wards.map((ward) => (
              <li key={ward.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                <span className="font-bold text-blue-300">{ward.name}</span> 
                <span className="text-gray-400 text-sm ml-2">(Ward #{ward.ward_number})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}