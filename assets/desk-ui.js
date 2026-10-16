// Arrange the existing controls around the operator's live tasks without replacing them.
export function arrangeDesk(){
  const main=document.querySelector('main.grid'),left=main.querySelector(':scope>section'),right=main.querySelector(':scope>aside');
  const show=document.querySelector('.show-desk'),conversation=document.querySelector('.conversation');
  if(show&&conversation)conversation.after(show);
  const subtitle=document.querySelector('header small');if(subtitle)subtitle.textContent='WISP · THE HAUNTED PUPPET';
  const layerBadge=left.querySelector('.stage+div .badge');if(layerBadge)layerBadge.textContent='Friendly Wisp · painted character';
  const method=document.getElementById('nativeMethod');if(method)method.classList.add('technical-method');
  const liveOption=document.querySelector('#conversationMode option[value=realtime]');if(liveOption)liveOption.textContent='Wisp talks with visitors';
  const note=document.getElementById('voiceMethod');if(note){const details=document.createElement('details');details.className='voice-production-note';details.innerHTML='<summary>Animation & voice details</summary>';note.parentElement.before(details);details.append(note.parentElement);}
  const stagePanel=[...left.querySelectorAll(':scope>.panel')].find(p=>p.querySelector('#stageSliders'));
  if(stagePanel){stagePanel.classList.add('stage-quick-controls');stagePanel.querySelector('h2').textContent='Stage controls';
    const appearance=stagePanel.querySelector('.twocol');if(appearance){const details=document.createElement('details');details.innerHTML='<summary>Artwork brightness & appearance</summary>';appearance.before(details);details.append(appearance);const help=details.nextElementSibling;if(help?.classList.contains('help'))details.append(help);}
  }
  const productionNote=left.querySelector('#status')?.nextElementSibling;
  if(productionNote?.classList.contains('help'))productionNote.remove();
  const library=[...left.querySelectorAll(':scope>.panel')].find(p=>p.querySelector('#prepared'));
  if(library){const details=document.createElement('details');details.className='panel saved-library';details.innerHTML='<summary>Saved performances & queue</summary>';library.before(details);details.append(library);library.classList.remove('panel');}
  // Missing artwork is a production note, rather than the first thing an operator sees.
  if(show){const form=document.querySelector('#friendlyForm')?.parentElement,heading=form?.previousElementSibling;
    if(form&&heading?.tagName==='H3'){const details=document.createElement('details');details.className='character-production-note';details.innerHTML='<summary>Character forms & production</summary>';heading.before(details);details.append(heading,form);}
  }
  if(show){const heading=show.querySelector('.cue-heading'),note=document.getElementById('includedVoiceNote'),cues=document.getElementById('showCues');if(heading&&cues){const details=document.createElement('details');details.className='recorded-cue-library';details.innerHTML='<summary>Recorded lines & saved scripts · optional</summary>';heading.before(details);details.append(heading);if(note)details.append(note);details.append(cues);}}
  const nav=document.createElement('nav');nav.className='desk-shortcuts';nav.setAttribute('aria-label','Show desk sections');
  nav.innerHTML='<a href="#liveConversation">Live voice</a><a href="#showMoments">Show moments</a><a href="#projectionSetup">Projection studio</a><a href="#phoneControls">Phone remote</a>';
  if(show)show.id='showMoments';const phone=document.querySelector('.phone-controls');if(phone)phone.id='phoneControls';
  document.querySelector('header').after(nav);
  nav.querySelectorAll('a').forEach(a=>a.onclick=e=>{let destination=document.querySelector(a.getAttribute('href'));if(!destination)return;e.preventDefault();if(destination.hidden)destination=document.getElementById('liveConversation');if(destination.tagName==='DETAILS')destination.open=true;destination.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});destination.tabIndex=-1;destination.focus({preventScroll:true});});
  window.HauntDesk={inspect:()=>({sections:[...nav.querySelectorAll('a')].map(a=>({name:a.textContent,target:a.hash,present:!!document.querySelector(a.hash)}))})};
}
