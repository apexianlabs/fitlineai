import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { bikeType, inseam, torso, armLength, height, flexibility, ridingStyle, currentIssues, experience, frameSize, unit, userId } = body

    if (!inseam || !height) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check usage limit
    if (userId) {
      const usageRes = await fetch(
        `${process.env.DB_API_URL}/usage/check?user_id=${userId}&product=fitlineai`,
        { headers: { 'Authorization': `Bearer ${process.env.DB_API_KEY_FITLINEAI}` } }
      )
      const usage = await usageRes.json()
      if (!usage.allowed) {
        return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
      }
    }

    const u = unit || 'cm'
    const prompt = `You are an expert bike fitter with 20 years of experience fitting professional cyclists. Generate a comprehensive bike fit recommendation based on these measurements.

Rider Measurements (in ${u}):
- Height: ${height}${u}
- Inseam: ${inseam}${u}
${torso ? `- Torso Length: ${torso}${u}` : ''}
${armLength ? `- Arm Length: ${armLength}${u}` : ''}

Rider Profile:
- Bike Type: ${bikeType}
- Riding Style: ${ridingStyle}
- Experience: ${experience}
- Flexibility: ${flexibility}
${frameSize ? `- Current Frame Size: ${frameSize}` : ''}
${currentIssues ? `- Current Pain/Issues: ${currentIssues}` : ''}

Calculate precise bike fit measurements using professional fitting formulas:
- Saddle height: typically 0.883 × inseam (LeMond method) or 0.885-0.895 × inseam
- Saddle setback, reach, stack based on riding style
- Handlebar height relative to saddle
- Stem length and angle

Respond ONLY with this JSON:
{
  "recommendedSize": "frame size recommendation e.g. 54cm or M/L",
  "sizeConfidence": <number 70-95>,
  "position": {
    "saddleHeight": "measurement with unit e.g. 72.4cm",
    "saddleSetback": "measurement e.g. 5-7cm behind BB",
    "reach": "measurement e.g. 38-40cm",
    "handlebarDrop": "e.g. 2-4cm below saddle",
    "stemLength": "e.g. 90-100mm",
    "crankLength": "e.g. 172.5mm"
  },
  "adjustments": [
    {"adjustment": "specific adjustment to make", "reason": "why this improves fit"},
    {"adjustment": "adjustment 2", "reason": "reason 2"},
    {"adjustment": "adjustment 3", "reason": "reason 3"}
  ],
  "painFixes": [
    {"issue": "pain issue from rider input", "fix": "specific adjustment to fix it"}
  ],
  "summary": "2-3 sentence overall summary of the fit recommendation and what the rider should prioritise",
  "bikeType": "${bikeType}",
  "ridingStyle": "${ridingStyle}"
}`

    const aiRes = await fetch(`${process.env.AI_API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ task: 'generate_bike_fit', inputs: { prompt } })
    })

    if (!aiRes.ok) throw new Error('AI generation failed')

    const aiData = await aiRes.json()
    let result = aiData.data || aiData.result || {}

    try {
      if (typeof result === 'string') {
        const clean = result.replace(/```json|```/g, '').trim()
        result = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean)
      } else if (result.raw_response) {
        const clean = result.raw_response.replace(/```json|```/g, '').trim()
        result = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean)
      }
    } catch(e) {}

    // Save to DB
    if (userId) {
      await fetch(`${process.env.DB_API_URL}/db/fitlineai/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_FITLINEAI}` },
        body: JSON.stringify({
          user_id: userId,
          title: `${bikeType} bike fit — ${height}${u} rider`,
          result_data: { ...result, height, inseam, torso, armLength, bikeType, ridingStyle, unit },
          status: 'active'
        })
      })
      await fetch(`${process.env.DB_API_URL}/usage/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_FITLINEAI}` },
        body: JSON.stringify({ user_id: userId, product: 'fitlineai', action: 'generate_bike_fit' })
      })
    }

    return NextResponse.json(result)
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
