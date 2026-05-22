'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

function GeneratePageInner() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('position')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    bikeType: 'road',
    inseam: '',
    torso: '',
    armLength: '',
    height: '',
    flexibility: 'moderate',
    ridingStyle: 'endurance',
    currentIssues: '',
    experience: 'intermediate',
    frameSize: '',
    unit: 'cm'
  })

  const COLOR = '#dc2626'

  useEffect(() => {
    const match = document.cookie.match(/fit_user=([^;]+)/)
    if (match) {
      try { setUser(JSON.parse(decodeURIComponent(match[1]))) } catch(e) {}
    }
  }, [])

  const handleGenerate = async () => {
    if (!form.inseam || !form.height) {
      setError('Please enter your inseam and height')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const token = document.cookie.match(/fit_token=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, userId: user?.id })
      })
      const data = await res.json()
      if (data.error === 'limit_reached') { setError('limit_reached'); setLoading(false); return }
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setResult(data)
      setActiveTab('position')
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' }
  const labelStyle = { fontSize:12, fontWeight:600, color:'#475569', marginBottom:4, display:'block' }

  if (error === 'limit_reached') return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'Inter,Arial,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:400,textAlign:'center',border:'1px solid #e2e8f0'}}>
        <div style={{fontSize:40,marginBottom:16}}>🚴</div>
        <h2 style={{fontSize:18,fontWeight:800,color:'#0f172a',marginBottom:8}}>Free limit reached</h2>
        <p style={{fontSize:14,color:'#64748b',marginBottom:24}}>Upgrade to get unlimited bike fit recommendations.</p>
        <Link href="/billing" style={{display:'block',background:COLOR,color:'#fff',padding:'12px 24px',borderRadius:9,textDecoration:'none',fontWeight:700,fontSize:14,marginBottom:12}}>Upgrade now →</Link>
        <button onClick={() => setError('')} style={{background:'none',border:'none',color:'#94a3b8',fontSize:13,cursor:'pointer'}}>Maybe later</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,Arial,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/dashboard" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:28,height:28,borderRadius:7,background:COLOR,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>F</div>
          <span style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>FitLine AI</span>
        </Link>
        <Link href="/dashboard" style={{fontSize:13,color:'#64748b',textDecoration:'none'}}>← Dashboard</Link>
      </div>

      <div style={{maxWidth:960,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:6}}>Get your perfect bike fit</h1>
          <p style={{fontSize:14,color:'#64748b'}}>Enter your measurements and riding style for AI-powered position recommendations.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns: result ? 'clamp(300px,45%,460px) 1fr' : '1fr',gap:24}}>
          {/* Form */}
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Your Measurements</h2>
              <div style={{display:'flex',gap:6}}>
                {['cm','inches'].map(u => (
                  <button key={u} onClick={() => setForm({...form, unit: u})}
                    style={{padding:'4px 10px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',
                      background: form.unit === u ? COLOR : '#f1f5f9',
                      color: form.unit === u ? '#fff' : '#64748b'}}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Bike Type</label>
                <select style={inputStyle} value={form.bikeType} onChange={e => setForm({...form, bikeType: e.target.value})}>
                  <option value="road">🚴 Road</option>
                  <option value="tt">⏱ Time Trial / Tri</option>
                  <option value="mtb">🚵 Mountain Bike</option>
                  <option value="gravel">🪨 Gravel</option>
                  <option value="cx">🌿 Cyclocross</option>
                  <option value="hybrid">🚲 Hybrid / City</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Experience Level</label>
                <select style={inputStyle} value={form.experience} onChange={e => setForm({...form, experience: e.target.value})}>
                  <option value="beginner">Beginner (0-1 yr)</option>
                  <option value="intermediate">Intermediate (1-3 yrs)</option>
                  <option value="advanced">Advanced (3+ yrs)</option>
                  <option value="racer">Racer / Pro</option>
                </select>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Height * ({form.unit})</label>
                <input style={inputStyle} type="number" placeholder={form.unit === 'cm' ? '175' : '69'} value={form.height}
                  onChange={e => setForm({...form, height: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Inseam * ({form.unit})</label>
                <input style={inputStyle} type="number" placeholder={form.unit === 'cm' ? '82' : '32'} value={form.inseam}
                  onChange={e => setForm({...form, inseam: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Torso Length ({form.unit})</label>
                <input style={inputStyle} type="number" placeholder={form.unit === 'cm' ? '58' : '23'} value={form.torso}
                  onChange={e => setForm({...form, torso: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Arm Length ({form.unit})</label>
                <input style={inputStyle} type="number" placeholder={form.unit === 'cm' ? '62' : '24'} value={form.armLength}
                  onChange={e => setForm({...form, armLength: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Flexibility</label>
                <select style={inputStyle} value={form.flexibility} onChange={e => setForm({...form, flexibility: e.target.value})}>
                  <option value="poor">Poor — can't touch toes</option>
                  <option value="moderate">Moderate — hands to shins</option>
                  <option value="good">Good — hands to floor</option>
                  <option value="excellent">Excellent — very flexible</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Riding Style</label>
                <select style={inputStyle} value={form.ridingStyle} onChange={e => setForm({...form, ridingStyle: e.target.value})}>
                  <option value="endurance">Endurance / Comfort</option>
                  <option value="sportive">Sportive / Gran Fondo</option>
                  <option value="racing">Racing / Performance</option>
                  <option value="climbing">Climbing Focused</option>
                  <option value="triathlon">Triathlon / TT</option>
                  <option value="commuting">Commuting / Leisure</option>
                </select>
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Current Frame Size (if known)</label>
              <input style={inputStyle} placeholder="e.g. 54cm, M, 56cm" value={form.frameSize}
                onChange={e => setForm({...form, frameSize: e.target.value})} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={labelStyle}>Current Pain / Issues</label>
              <textarea style={{...inputStyle, height:70, resize:'vertical'}}
                placeholder="e.g. knee pain, lower back ache, numb hands, saddle soreness..."
                value={form.currentIssues} onChange={e => setForm({...form, currentIssues: e.target.value})} />
            </div>

            {error && error !== 'limit_reached' && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:'#dc2626'}}>{error}</div>
            )}

            <button onClick={handleGenerate} disabled={loading}
              style={{width:'100%',background:loading ? '#fca5a5' : COLOR,color:'#fff',border:'none',borderRadius:9,padding:'13px 24px',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer'}}>
              {loading ? '🔍 Calculating fit...' : '🚴 Get My Bike Fit'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
              <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4}}>Your Fit Recommendations</h2>
              <p style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>{result.bikeType} bike · {result.ridingStyle} position</p>

              {/* Frame size badge */}
              {result.recommendedSize && (
                <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:2}}>RECOMMENDED FRAME SIZE</div>
                    <div style={{fontSize:22,fontWeight:800,color:COLOR}}>{result.recommendedSize}</div>
                  </div>
                  {result.sizeConfidence && (
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:18,fontWeight:800,color: result.sizeConfidence >= 80 ? '#16a34a' : '#d97706'}}>{result.sizeConfidence}%</div>
                      <div style={{fontSize:11,color:'#94a3b8'}}>Confidence</div>
                    </div>
                  )}
                </div>
              )}

              {/* Tabs */}
              <div style={{display:'flex',gap:6,marginBottom:16,borderBottom:'1px solid #f1f5f9',paddingBottom:8,flexWrap:'wrap'}}>
                {[
                  {key:'position', label:'📐 Position'},
                  {key:'adjustments', label:'🔧 Adjustments'},
                  {key:'issues', label:'💊 Pain Fixes'},
                  {key:'summary', label:'📋 Summary'},
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{padding:'6px 10px',borderRadius:6,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',
                      background:activeTab===tab.key ? COLOR : '#f1f5f9',
                      color:activeTab===tab.key ? '#fff' : '#64748b'}}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'position' && result.position && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {Object.entries(result.position).map(([key, val], i) => (
                    <div key={i} style={{background:'#f8fafc',borderRadius:8,padding:'12px 14px',border:'1px solid #e2e8f0'}}>
                      <div style={{fontSize:10,fontWeight:600,color:'#94a3b8',marginBottom:4,textTransform:'uppercase'}}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div style={{fontSize:14,fontWeight:800,color:COLOR}}>{val}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'adjustments' && result.adjustments && (
                <div>
                  {result.adjustments.map((a, i) => (
                    <div key={i} style={{display:'flex',gap:10,marginBottom:12,alignItems:'flex-start',padding:'10px 12px',background:'#f8fafc',borderRadius:8}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:COLOR,color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:'#0f172a',marginBottom:2}}>{a.adjustment}</div>
                        <div style={{fontSize:12,color:'#64748b'}}>{a.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'issues' && (
                <div>
                  {result.painFixes && result.painFixes.length > 0 ? result.painFixes.map((p, i) => (
                    <div key={i} style={{marginBottom:12,padding:'10px 12px',background:'#fff7ed',borderRadius:8,border:'1px solid #fed7aa'}}>
                      <div style={{fontSize:12,fontWeight:700,color:'#d97706',marginBottom:4}}>{p.issue}</div>
                      <div style={{fontSize:13,color:'#334155'}}>{p.fix}</div>
                    </div>
                  )) : (
                    <div style={{fontSize:13,color:'#64748b',padding:12}}>No specific pain issues to address based on your input.</div>
                  )}
                </div>
              )}

              {activeTab === 'summary' && result.summary && (
                <div style={{background:'#f8fafc',borderRadius:8,padding:14,fontSize:13,color:'#334155',lineHeight:1.7}}>{result.summary}</div>
              )}

              <button onClick={() => {
                const pos = result.position ? Object.entries(result.position).map(([k,v]) => `${k}: ${v}`).join('\n') : ''
                const txt = `FitLine AI — Bike Fit Report\nBike: ${result.bikeType} | Style: ${result.ridingStyle}\nFrame Size: ${result.recommendedSize}\n\nPosition:\n${pos}\n\nSummary:\n${result.summary}`
                navigator.clipboard.writeText(txt)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }} style={{width:'100%',marginTop:16,background:'#f1f5f9',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#475569',cursor:'pointer'}}>
                {copied ? '✓ Copied!' : '📋 Copy Fit Report'}
              </button>

              <Link href="/dashboard" style={{display:'block',marginTop:10,textAlign:'center',fontSize:13,color:'#94a3b8',textDecoration:'none'}}>View all fits →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return <Suspense><GeneratePageInner /></Suspense>
}
