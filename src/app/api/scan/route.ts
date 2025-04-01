import { jobQueue } from "@/lib/queue";


export async function POST(request: Request) {
  const authToken = request.headers.get("Authorization");
  if (authToken != process.env.SCAN_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  //Get JSON body
  const jsonRequest = await request.json();
  console.log(jsonRequest);
  
  //Add job to the queue
  await jobQueue.add('serverScan', jsonRequest);
  
  // Return success
  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
}
