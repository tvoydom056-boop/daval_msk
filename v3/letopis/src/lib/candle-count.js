export function candleCountText(count){
  const value=Number.isFinite(Number(count))?Math.max(0,Math.floor(Number(count))):0;
  if(!value)return 'Будьте первым, кто зажжёт свечу';
  const hundred=value%100,unit=value%10;
  const ending=hundred>=11&&hundred<=14?'свечей зажжено':unit===1?'свеча зажжена':unit>=2&&unit<=4?'свечи зажжены':'свечей зажжено';
  return `${value} ${ending}`;
}
