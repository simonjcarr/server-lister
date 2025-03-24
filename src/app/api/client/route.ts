export async function POST(request: Request) {
  const jsonRequest = await request.json();
  const authToken = request.headers.get('Authorization');
  console.log("JSON Body:", jsonRequest);
  console.log("Auth Token:", authToken);
  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
}
