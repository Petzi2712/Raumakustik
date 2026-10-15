// Preserve both positive and negative extrema in each time/frequency bucket.
export function downsampleSeries(data,maxPoints=1400){
  if(data.length<=maxPoints)return data;
  const bucket=Math.ceil(data.length/(maxPoints/2)),out=[];
  for(let start=0;start<data.length;start+=bucket){let min=start,max=start;for(let i=start;i<Math.min(data.length,start+bucket);i++){if(data[i][1]<data[min][1])min=i;if(data[i][1]>data[max][1])max=i;}if(min===max)out.push(data[min]);else out.push(...[min,max].sort((a,b)=>a-b).map(i=>data[i]));}
  return out;
}
