import { NextRequest, NextResponse } from 'next/server';

const languageMap: Record<string, string> = {
  python: 'python3',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
};

export async function POST(req: NextRequest) {
  const { code, language } = await req.json();
  const jdoodleLang = languageMap[language];
  if (!jdoodleLang) {
    return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
  }

  const apiUrl = process.env.JDOODLE_API_URL || 'https://api.jdoodle.com/v1/execute';
  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      clientSecret,
      script: code,
      language: jdoodleLang,
      versionIndex: '0',
    }),
  });
  const data = await res.json();
  // Debug: log response
  console.log('JDoodle API response:', data);
  return NextResponse.json({
    output: data.output || '',
    error: data.error || '',
    statusCode: data.statusCode || 0,
  });
}
