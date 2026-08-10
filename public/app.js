async function analyze(){
  const sender=document.getElementById("sender").value.trim();
  const recipient=document.getElementById("recipient").value.trim();
  const asset=document.getElementById("asset").value;
  const amount=document.getElementById("amount").value;
  if(!sender||!recipient||!amount){alert("Please complete sender, recipient and amount.");return;}
  const btn=document.querySelector(".analyze");
  btn.disabled=true;btn.innerHTML="Analyzing transaction…";
  try{
    const r=await fetch("/api/transaction-risk",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sender,recipient,asset,amount})});
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||"Analysis failed");
    document.getElementById("result").classList.remove("hidden");
    document.getElementById("score").textContent=d.score;
    document.querySelector(".score-ring").style.background=`conic-gradient(var(--danger) 0 ${d.score}%,#1e2636 ${d.score}%)`;
    document.getElementById("level").textContent=d.level+" RISK";
    document.getElementById("level").style.color=d.level==="HIGH"?"var(--danger)":d.level==="MEDIUM"?"var(--yellow)":"var(--green)";
    document.getElementById("ex-title").textContent=d.action;
    document.getElementById("explain").textContent=d.explanation;
    document.getElementById("action").textContent=d.action;
    document.getElementById("signal-count").textContent=d.signals.length+" signals";
    document.getElementById("signal-list").innerHTML=d.signals.map(s=>`<div class="signal"><div class="sev ${s[0].toLowerCase()}">${s[0]}</div><div><b>${s[1]}</b><small>${s[2]}</small></div></div>`).join("");
    document.getElementById("f-sender").textContent=sender;
    document.getElementById("f-recipient").textContent=recipient;
    document.getElementById("f-asset").textContent=asset;
    document.getElementById("f-amount").textContent=amount+" "+asset;
    document.getElementById("result").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){alert(e.message)}
  finally{btn.disabled=false;btn.innerHTML='Analyze Transaction <span>→</span>'}
}
function newScan(){
  document.getElementById("result").classList.add("hidden");
  document.querySelector(".form-card").scrollIntoView({behavior:"smooth"});
}
