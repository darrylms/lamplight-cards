// Colour names. The design document is design-docs/shared_palette_options.html ("One Name per
// Colour"). The household selected option 1, "Names in the Box", on 22 November 2026.
//
// This file has two sections:
//   1. THE PALETTE. These names decorate: a room, a scene. Each name is one plain word.
//   2. THE MEANINGS. These colours have a meaning: an open window, a low battery, a weather
//      warning. Their names are reserved. A config writes a reserved name as group-key, for
//      example window-open or battery-alert. A reserved name always has a hyphen, so it never
//      collides with a palette name.
//
// A card reads a colour from its config with lampColour(value, tone). The value can be:
//   a palette name           "marigold"        the tone that the card asks for
//   a palette name and tone  "marigold.deep"   that tone
//   a reserved name          "window-open"     the colour of that meaning
//   a raw colour             "250,152,30", "#fa981e", "rgb(250,152,30)"   as before (lampAccent)
//
// Rules for the names. test/verify-colours.js checks each rule.
//   - A palette name is one word of lower-case letters. It is not a CSS colour name, and it is
//     not a word that a hex colour can be ("bad", "decade").
//   - A palette name is not a household word, a weather word or a reserved group, and it is not
//     amber, ember or core.
//   - One entry for each meaning. Two meanings that have the same value today are still two
//     entries, so that a change to one never changes the other.
//   - Each meaning names its decision in master_design.html. A change to a meaning is an
//     amendment to that document. The test pins the values.
//   - The derived colours (CORE, EMBER, the far colour, the quiet ink, the 62% header chroma)
//     are rules, not colours. They stay in code (src/00-colour.js and the cards).

// ── SECTION 1 · THE PALETTE ──────────────────────────────────────────────────────────────────
// A colour is a soft tone and a deep tone. The cards that use each tone:
//   soft   rows (lamplight-light, lamplight-row, lamplight-rooms), the climate wave, the climate sheet line,
//          a routine's name and glass, the chips
//   deep   the panel shell (lamplight-panel), the pop-up (lamplight-popup), the plug and purifier sheets,
//          a routine's glow, backlight and spill
// A routine colour can also have:
//   glass  [colour, mix]: the unlit glass lamp (lamp: glass)
//   orb    the glass orb (lamp_style: orb). Five orbs are fitted to the household's pictures by
//          test/orb-fit/ (heather, honey, persimmon, cerulean, periwinkle). Thirteen more are derived
//          from the fitted orb nearest in hue by test/orb-fit/derive.js: each colour of the orb turns
//          by the hue gap of the two deep tones in OKLCH, the chroma scales by their ratio, and the
//          lightness and the geometry stay. Design document: design-docs/house_scenes_orb_colours_options.html,
//          option 1 "Nearest Glass, Turned", selected 22 Nov 2026. Do not edit a derived orb by hand:
//          run `node test/orb-fit/derive.js --write`. The four waste bin colours have no orb.
// The first ten values are the household's own pairs, measured from the live config on 22 Nov 2026.
// The last eight are for other households. They come from a rule, not from a room. Design document:
// design-docs/palette_more_options.html, option 2 "Four Vivid, Four Quiet", selected 22 Nov 2026.
// test/palette-pair.js makes a pair from a hue with the rule. test/verify-colours.js checks each
// entry after the first ten against the gates in that document.
const LAMP_PALETTE = {
  marigold:   { soft: '235,170,70',  deep: '250,152,30', orb: {"off":{"C0":"87,74,59","C1":"0,0,1","p":0.783,"p1":1.183,"cx":0.139,"cy":0.077,"S":"12,2,0","r0":0.459,"aS":0.218,"T":"244,212,187","tx":0.462,"ty":0.771,"t0":1.043,"t1":2.347,"aT":0.984,"B":"255,215,186","bx":-0.03,"by":-0.354,"b0":0.836,"b1":1.718,"aB":0.851,"tw":0.314,"tk":0.866,"bw":0.076,"bk":0.925,"R0":"0,0,4","w0":0.025,"a0":1,"RT":"255,251,242","yT":0.041,"wT":0.07,"aRT":0.793,"RB":"254,255,234","yB":0.141,"wB":0.128,"aRB":0.294},"lit":{"C0":"118,95,75","C1":"131,108,86","p":0.083,"p1":1.04,"cx":0.49,"cy":0.06,"S":"55,13,2","r0":0.536,"aS":0.688,"T":"255,231,205","tx":0.203,"ty":0.547,"t0":0.772,"t1":1.745,"aT":1,"B":"255,224,183","bx":-0.073,"by":-0.278,"b0":0.694,"b1":1.372,"aB":0.999,"tw":0.044,"tk":0.942,"bw":0.02,"bk":0.816,"R0":"103,0,10","w0":0.02,"a0":0.877,"RT":"255,255,248","yT":0.052,"wT":0.084,"aRT":0.914,"RB":"255,252,241","yB":0.248,"wB":0.147,"aRB":0.969},"halo":{"c":"185,142,104","b1":5.6,"a1":0.933,"b2":19.1,"a2":0.892},"icon":{"off":"253,236,217","lit":"253,242,227"}} },   // Lounge & Kitchen
  cornflower: { soft: '90,150,245',  deep: '46,124,255', orb: {"off":{"C0":"44,57,77","C1":"0,1,2","p":0.898,"p1":1.301,"cx":0.227,"cy":-0.007,"S":"2,0,26","r0":0.585,"aS":0.318,"T":"182,212,255","tx":0.343,"ty":0.789,"t0":0.988,"t1":2.365,"aT":0.99,"B":"122,151,193","bx":-0.049,"by":-0.326,"b0":0.851,"b1":1.498,"aB":1,"tw":0.176,"tk":0.989,"bw":0.209,"bk":0.972,"R0":"5,0,73","w0":0.023,"a0":0.998,"RT":"236,253,255","yT":0.043,"wT":0.061,"aRT":0.86,"RB":"217,255,243","yB":0.153,"wB":0.108,"aRB":0.41},"lit":{"C0":"61,83,116","C1":"96,131,150","p":0.605,"p1":1.041,"cx":-0.043,"cy":-0.245,"S":"10,16,84","r0":0.517,"aS":0.885,"T":"200,238,255","tx":0.165,"ty":0.6,"t0":0.735,"t1":1.791,"aT":0.989,"B":"189,230,255","bx":-0.068,"by":-0.279,"b0":0.806,"b1":1.331,"aB":1,"tw":0.35,"tk":0.977,"bw":0.218,"bk":0.996,"R0":"34,26,194","w0":0.02,"a0":0.997,"RT":"241,254,255","yT":0.064,"wT":0.086,"aRT":1,"RB":"243,255,252","yB":0.204,"wB":0.112,"aRB":0.827},"halo":{"c":"122,172,230","b1":19,"a1":0.831,"b2":5.2,"a2":0.684},"icon":{"off":"201,229,250","lit":"208,238,255"}} },   // Hallway
  iris:       { soft: '170,110,245', deep: '138,64,255', orb: {"off":{"C0":"60,46,76","C1":"128,104,154","p":0.539,"p1":1.254,"cx":0.147,"cy":0.414,"S":"39,25,53","r0":0.404,"aS":0.73,"T":"222,179,248","tx":0.285,"ty":0.691,"t0":1.2,"t1":2.048,"aT":0.992,"B":"157,128,184","bx":-0.136,"by":-0.482,"b0":1.008,"b1":1.697,"aB":1,"tw":0.194,"tk":0.658,"bw":0.163,"bk":0.684,"R0":"180,51,98","w0":0.021,"a0":0.466,"RT":"239,248,255","yT":0.047,"wT":0.088,"aRT":0.549,"RB":"188,173,212","yB":0.244,"wB":0.117,"aRB":0.557},"lit":{"C0":"111,74,137","C1":"248,246,218","p":0.874,"p1":1.273,"cx":-0.155,"cy":0.008,"S":"46,0,112","r0":0.686,"aS":0.678,"T":"247,196,245","tx":0.254,"ty":0.659,"t0":0.874,"t1":1.84,"aT":1,"B":"250,201,245","bx":-0.047,"by":-0.341,"b0":0.884,"b1":1.405,"aB":1,"tw":0.243,"tk":0.755,"bw":0.36,"bk":0.885,"R0":"82,0,169","w0":0.029,"a0":0.971,"RT":"252,255,251","yT":0.049,"wT":0.098,"aRT":0.797,"RB":"253,254,254","yB":0.087,"wB":0.122,"aRB":0.569},"halo":{"c":"199,112,224","b1":7.7,"a1":0.711,"b2":21.6,"a2":0.594},"icon":{"off":"236,208,245","lit":"249,219,246"}} },   // Games Room
  lagoon:     { soft: '55,200,190',  deep: '20,205,188', orb: {"off":{"C0":"42,61,57","C1":"0,1,1","p":0.898,"p1":1.301,"cx":0.227,"cy":-0.007,"S":"0,5,5","r0":0.585,"aS":0.318,"T":"176,220,212","tx":0.343,"ty":0.789,"t0":0.988,"t1":2.365,"aT":0.99,"B":"119,159,151","bx":-0.049,"by":-0.326,"b0":0.851,"b1":1.498,"aB":1,"tw":0.176,"tk":0.989,"bw":0.209,"bk":0.972,"R0":"0,23,23","w0":0.023,"a0":0.998,"RT":"246,251,241","yT":0.043,"wT":0.061,"aRT":0.86,"RB":"249,246,226","yB":0.153,"wB":0.108,"aRB":0.41},"lit":{"C0":"57,90,84","C1":"110,131,118","p":0.605,"p1":1.041,"cx":-0.043,"cy":-0.245,"S":"0,35,35","r0":0.517,"aS":0.885,"T":"215,238,220","tx":0.165,"ty":0.6,"t0":0.735,"t1":1.791,"aT":0.989,"B":"202,232,214","bx":-0.068,"by":-0.279,"b0":0.806,"b1":1.331,"aB":1,"tw":0.35,"tk":0.977,"bw":0.218,"bk":0.996,"R0":"0,81,80","w0":0.02,"a0":0.997,"RT":"249,253,244","yT":0.064,"wT":0.086,"aRT":1,"RB":"253,252,246","yB":0.204,"wB":0.112,"aRB":0.827},"halo":{"c":"125,182,168","b1":19,"a1":0.831,"b2":5.2,"a2":0.684},"icon":{"off":"209,230,220","lit":"220,238,226"}} },   // Bathroom
  rose:       { soft: '235,110,180', deep: '255,64,160', orb: {"off":{"C0":"54,53,46","C1":"200,108,163","p":0.387,"p1":1.391,"cx":0.181,"cy":0.498,"S":"84,46,66","r0":0.3,"aS":0.996,"T":"220,126,184","tx":0.034,"ty":0.621,"t0":0.93,"t1":1.596,"aT":0.674,"B":"75,37,63","bx":-0.596,"by":-0.816,"b0":0,"b1":1.452,"aB":0.925,"tw":0.02,"tk":0,"bw":0.132,"bk":0.938,"R0":"255,239,247","w0":0.082,"a0":0.347,"RT":"255,193,210","yT":0.051,"wT":0.087,"aRT":0.46,"RB":"106,59,91","yB":0.235,"wB":0.281,"aRB":1},"lit":{"C0":"138,56,106","C1":"248,146,202","p":0.603,"p1":1.478,"cx":0.195,"cy":0.467,"S":"115,23,83","r0":0.434,"aS":0.955,"T":"255,190,218","tx":0.188,"ty":0.586,"t0":1.004,"t1":1.734,"aT":0.948,"B":"255,157,203","bx":-0.073,"by":-0.273,"b0":0.661,"b1":1.448,"aB":0.82,"tw":0.437,"tk":0.798,"bw":0.097,"bk":0.891,"R0":"250,255,248","w0":0.079,"a0":0.996,"RT":"209,59,182","yT":0.02,"wT":0.02,"aRT":0.758,"RB":"254,142,198","yB":0.223,"wB":0.135,"aRB":1},"halo":{"c":"254,76,179","b1":5.9,"a1":0.458,"b2":18.8,"a2":0.628},"icon":{"off":"250,248,249","lit":"253,250,251"}} },   // Bedroom
  heather:    { soft: '222,136,212', deep: '214,96,210', orb: {"off":{"C0":"56,52,47","C1":"173,121,188","p":0.387,"p1":1.391,"cx":0.181,"cy":0.498,"S":"73,51,77","r0":0.3,"aS":0.996,"T":"191,139,209","tx":0.034,"ty":0.621,"t0":0.93,"t1":1.596,"aT":0.674,"B":"63,43,73","bx":-0.596,"by":-0.816,"b0":0,"b1":1.452,"aB":0.925,"tw":0.02,"tk":0,"bw":0.132,"bk":0.938,"R0":"251,240,253","w0":0.082,"a0":0.347,"RT":"242,196,231","yT":0.051,"wT":0.087,"aRT":0.46,"RB":"91,66,103","yB":0.235,"wB":0.281,"aRB":1},"lit":{"C0":"116,69,128","C1":"218,159,231","p":0.603,"p1":1.478,"cx":0.195,"cy":0.467,"S":"94,42,106","r0":0.434,"aS":0.955,"T":"252,184,255","tx":0.188,"ty":0.586,"t0":1.004,"t1":1.734,"aT":0.948,"B":"241,157,246","bx":-0.073,"by":-0.273,"b0":0.661,"b1":1.448,"aB":0.82,"tw":0.437,"tk":0.798,"bw":0.097,"bk":0.891,"R0":"253,254,247","w0":0.079,"a0":0.996,"RT":"167,92,216","yT":0.02,"wT":0.02,"aRT":0.758,"RB":"224,156,230","yB":0.223,"wB":0.135,"aRB":1},"halo":{"c":"213,108,226","b1":5.9,"a1":0.458,"b2":18.8,"a2":0.628},"icon":{"off":"249,248,250","lit":"252,250,252"}} },
  honey:      { soft: '242,178,92',  deep: '252,160,30', orb: {"off":{"C0":"86,74,59","C1":"0,0,1","p":0.783,"p1":1.183,"cx":0.139,"cy":0.077,"S":"12,2,0","r0":0.459,"aS":0.218,"T":"243,213,186","tx":0.462,"ty":0.771,"t0":1.043,"t1":2.347,"aT":0.984,"B":"254,216,184","bx":-0.03,"by":-0.354,"b0":0.836,"b1":1.718,"aB":0.851,"tw":0.314,"tk":0.866,"bw":0.076,"bk":0.925,"R0":"0,0,4","w0":0.025,"a0":1,"RT":"255,251,241","yT":0.041,"wT":0.07,"aRT":0.793,"RB":"253,255,235","yB":0.141,"wB":0.128,"aRB":0.294},"lit":{"C0":"117,96,74","C1":"130,109,85","p":0.083,"p1":1.04,"cx":0.49,"cy":0.06,"S":"55,14,0","r0":0.536,"aS":0.688,"T":"255,231,202","tx":0.203,"ty":0.547,"t0":0.772,"t1":1.745,"aT":1,"B":"255,225,178","bx":-0.073,"by":-0.278,"b0":0.694,"b1":1.372,"aB":0.999,"tw":0.044,"tk":0.942,"bw":0.02,"bk":0.816,"R0":"103,0,1","w0":0.02,"a0":0.877,"RT":"255,255,245","yT":0.052,"wT":0.084,"aRT":0.914,"RB":"255,252,239","yB":0.248,"wB":0.147,"aRB":0.969},"halo":{"c":"183,143,103","b1":5.6,"a1":0.933,"b2":19.1,"a2":0.892},"icon":{"off":"252,236,217","lit":"252,242,227"}} },
  persimmon:  { soft: '232,121,107', deep: '250,88,48',  glass: ['250,100,45', 0.38], orb: {"off":{"C0":"99,58,48","C1":"13,0,0","p":0.716,"p1":1.201,"cx":0.155,"cy":0.18,"S":"4,0,0","r0":0.529,"aS":0.134,"T":"255,172,150","tx":0.372,"ty":0.701,"t0":0.871,"t1":2.089,"aT":1,"B":"249,152,133","bx":-0.044,"by":-0.213,"b0":0.776,"b1":1.446,"aB":0.613,"tw":0.126,"tk":0.907,"bw":0.097,"bk":0.935,"R0":"66,0,25","w0":0.174,"a0":0.151,"RT":"255,238,202","yT":0.041,"wT":0.065,"aRT":1,"RB":"250,214,166","yB":0.293,"wB":0.216,"aRB":0.296},"lit":{"C0":"138,84,72","C1":"251,195,167","p":0.899,"p1":1.364,"cx":0.094,"cy":-0.336,"S":"81,0,0","r0":0.597,"aS":0.768,"T":"255,197,181","tx":0.188,"ty":0.484,"t0":0.719,"t1":1.652,"aT":1,"B":"254,174,152","bx":-0.129,"by":-0.251,"b0":0.781,"b1":1.355,"aB":1,"tw":0.17,"tk":0.9,"bw":0.19,"bk":0.967,"R0":"105,0,0","w0":0.02,"a0":0.973,"RT":"255,255,255","yT":0.043,"wT":0.082,"aRT":1,"RB":"255,250,243","yB":0.228,"wB":0.172,"aRB":0.594},"halo":{"c":"208,117,102","b1":19.3,"a1":0.816,"b2":5.3,"a2":0.797},"icon":{"off":"250,222,207","lit":"252,236,223"}} },
  cerulean:   { soft: '79,166,233',  deep: '40,140,255', orb: {"off":{"C0":"43,58,75","C1":"0,1,2","p":0.898,"p1":1.301,"cx":0.227,"cy":-0.007,"S":"1,1,24","r0":0.585,"aS":0.318,"T":"178,213,255","tx":0.343,"ty":0.789,"t0":0.988,"t1":2.365,"aT":0.99,"B":"121,152,189","bx":-0.049,"by":-0.326,"b0":0.851,"b1":1.498,"aB":1,"tw":0.176,"tk":0.989,"bw":0.209,"bk":0.972,"R0":"0,1,74","w0":0.023,"a0":0.998,"RT":"233,254,255","yT":0.043,"wT":0.061,"aRT":0.86,"RB":"221,254,241","yB":0.153,"wB":0.108,"aRB":0.41},"lit":{"C0":"60,84,113","C1":"97,131,147","p":0.605,"p1":1.041,"cx":-0.043,"cy":-0.245,"S":"3,21,80","r0":0.517,"aS":0.885,"T":"196,239,255","tx":0.165,"ty":0.6,"t0":0.735,"t1":1.791,"aT":0.989,"B":"185,231,255","bx":-0.068,"by":-0.279,"b0":0.806,"b1":1.331,"aB":1,"tw":0.35,"tk":0.977,"bw":0.218,"bk":0.996,"R0":"9,43,184","w0":0.02,"a0":0.997,"RT":"239,255,255","yT":0.064,"wT":0.086,"aRT":1,"RB":"244,255,251","yB":0.204,"wB":0.112,"aRB":0.827},"halo":{"c":"121,174,224","b1":19,"a1":0.831,"b2":5.2,"a2":0.684},"icon":{"off":"201,229,247","lit":"209,238,252"}} },
  periwinkle: { soft: '130,134,236', deep: '90,96,255',  orb: {"off":{"C0":"51,50,77","C1":"113,110,157","p":0.539,"p1":1.254,"cx":0.147,"cy":0.414,"S":"31,29,54","r0":0.404,"aS":0.73,"T":"201,188,254","tx":0.285,"ty":0.691,"t0":1.2,"t1":2.048,"aT":0.992,"B":"140,135,188","bx":-0.136,"by":-0.482,"b0":1.008,"b1":1.697,"aB":1,"tw":0.194,"tk":0.658,"bw":0.163,"bk":0.684,"R0":"163,65,129","w0":0.021,"a0":0.466,"RT":"239,249,252","yT":0.047,"wT":0.088,"aRT":0.549,"RB":"176,178,213","yB":0.244,"wB":0.117,"aRB":0.557},"lit":{"C0":"93,82,142","C1":"255,243,220","p":0.874,"p1":1.273,"cx":-0.155,"cy":0.008,"S":"20,0,129","r0":0.686,"aS":0.678,"T":"230,203,255","tx":0.254,"ty":0.659,"t0":0.874,"t1":1.84,"aT":1,"B":"234,207,255","bx":-0.047,"by":-0.341,"b0":0.884,"b1":1.405,"aB":1,"tw":0.243,"tk":0.755,"bw":0.36,"bk":0.885,"R0":"48,0,196","w0":0.029,"a0":0.971,"RT":"253,255,249","yT":0.049,"wT":0.098,"aRT":0.797,"RB":"253,254,254","yB":0.087,"wB":0.122,"aRB":0.569},"halo":{"c":"168,128,238","b1":7.7,"a1":0.711,"b2":21.6,"a2":0.594},"icon":{"off":"223,213,250","lit":"239,223,252"}} },
  // For other households. Vivid: strength 1. Each name is the hue of its deep tone in OKLCH.
  cranberry:  { soft: '247,100,127', deep: '252,23,98', orb: {"off":{"C0":"104,52,60","C1":"13,0,2","p":0.716,"p1":1.201,"cx":0.155,"cy":0.18,"S":"4,0,1","r0":0.529,"aS":0.134,"T":"255,168,177","tx":0.372,"ty":0.701,"t0":0.871,"t1":2.089,"aT":1,"B":"255,143,163","bx":-0.044,"by":-0.213,"b0":0.776,"b1":1.446,"aB":0.613,"tw":0.126,"tk":0.907,"bw":0.097,"bk":0.935,"R0":"62,0,45","w0":0.174,"a0":0.151,"RT":"255,236,219","yT":0.041,"wT":0.065,"aRT":1,"RB":"255,210,183","yB":0.293,"wB":0.216,"aRB":0.296},"lit":{"C0":"144,77,88","C1":"255,191,184","p":0.899,"p1":1.364,"cx":0.094,"cy":-0.336,"S":"78,0,30","r0":0.597,"aS":0.768,"T":"255,194,199","tx":0.188,"ty":0.484,"t0":0.719,"t1":1.652,"aT":1,"B":"255,170,178","bx":-0.129,"by":-0.251,"b0":0.781,"b1":1.355,"aB":1,"tw":0.17,"tk":0.9,"bw":0.19,"bk":0.967,"R0":"102,0,42","w0":0.02,"a0":0.973,"RT":"255,255,255","yT":0.043,"wT":0.082,"aRT":1,"RB":"255,250,246","yB":0.228,"wB":0.172,"aRB":0.594},"halo":{"c":"217,105,130","b1":19.3,"a1":0.816,"b2":5.3,"a2":0.797},"icon":{"off":"255,219,214","lit":"255,234,227"}} },    // 12 degrees
  citron:     { soft: '196,181,93',  deep: '197,175,24', orb: {"off":{"C0":"78,77,61","C1":"0,0,1","p":0.783,"p1":1.183,"cx":0.139,"cy":0.077,"S":"8,4,0","r0":0.459,"aS":0.218,"T":"227,220,186","tx":0.462,"ty":0.771,"t0":1.043,"t1":2.347,"aT":0.984,"B":"236,224,183","bx":-0.03,"by":-0.354,"b0":0.836,"b1":1.718,"aB":0.851,"tw":0.314,"tk":0.866,"bw":0.076,"bk":0.925,"R0":"1,0,3","w0":0.025,"a0":1,"RT":"250,253,243","yT":0.041,"wT":0.07,"aRT":0.793,"RB":"248,255,248","yB":0.141,"wB":0.128,"aRB":0.294},"lit":{"C0":"105,101,75","C1":"117,114,87","p":0.083,"p1":1.04,"cx":0.49,"cy":0.06,"S":"43,25,0","r0":0.536,"aS":0.688,"T":"239,237,205","tx":0.203,"ty":0.547,"t0":0.772,"t1":1.745,"aT":1,"B":"231,234,186","bx":-0.073,"by":-0.278,"b0":0.694,"b1":1.372,"aB":0.999,"tw":0.044,"tk":0.942,"bw":0.02,"bk":0.816,"R0":"78,41,0","w0":0.02,"a0":0.877,"RT":"252,255,252","yT":0.052,"wT":0.084,"aRT":0.914,"RB":"248,254,243","yB":0.248,"wB":0.147,"aRB":0.969},"halo":{"c":"162,153,104","b1":5.6,"a1":0.933,"b2":19.1,"a2":0.892},"icon":{"off":"241,240,219","lit":"244,245,229"}} },   // 100 degrees
  pear:       { soft: '142,196,93',  deep: '120,194,24', orb: {"off":{"C0":"67,81,62","C1":"0,0,0","p":0.783,"p1":1.183,"cx":0.139,"cy":0.077,"S":"5,5,0","r0":0.459,"aS":0.218,"T":"207,227,186","tx":0.462,"ty":0.771,"t0":1.043,"t1":2.347,"aT":0.984,"B":"212,234,182","bx":-0.03,"by":-0.354,"b0":0.836,"b1":1.718,"aB":0.851,"tw":0.314,"tk":0.866,"bw":0.076,"bk":0.925,"R0":"1,0,1","w0":0.025,"a0":1,"RT":"243,255,246","yT":0.041,"wT":0.07,"aRT":0.793,"RB":"246,255,252","yB":0.141,"wB":0.128,"aRB":0.294},"lit":{"C0":"89,107,76","C1":"100,120,89","p":0.083,"p1":1.04,"cx":0.49,"cy":0.06,"S":"32,30,0","r0":0.536,"aS":0.688,"T":"218,245,208","tx":0.203,"ty":0.547,"t0":0.772,"t1":1.745,"aT":1,"B":"197,245,194","bx":-0.073,"by":-0.278,"b0":0.694,"b1":1.372,"aB":0.999,"tw":0.044,"tk":0.942,"bw":0.02,"bk":0.816,"R0":"63,50,0","w0":0.02,"a0":0.877,"RT":"252,255,254","yT":0.052,"wT":0.084,"aRT":0.914,"RB":"243,255,248","yB":0.248,"wB":0.147,"aRB":0.969},"halo":{"c":"133,163,105","b1":5.6,"a1":0.933,"b2":19.1,"a2":0.892},"icon":{"off":"228,245,221","lit":"233,249,232"}} },   // 132 degrees
  amethyst:   { soft: '196,101,243', deep: '190,24,251', orb: {"off":{"C0":"59,51,45","C1":"165,115,226","p":0.387,"p1":1.391,"cx":0.181,"cy":0.498,"S":"70,49,92","r0":0.3,"aS":0.996,"T":"181,133,248","tx":0.034,"ty":0.621,"t0":0.93,"t1":1.596,"aT":0.674,"B":"58,41,89","bx":-0.596,"by":-0.816,"b0":0,"b1":1.452,"aB":0.925,"tw":0.02,"tk":0,"bw":0.132,"bk":0.938,"R0":"247,241,255","w0":0.082,"a0":0.347,"RT":"242,191,255","yT":0.051,"wT":0.087,"aRT":0.46,"RB":"85,64,123","yB":0.235,"wB":0.281,"aRB":1},"lit":{"C0":"110,61,160","C1":"204,161,255","p":0.603,"p1":1.478,"cx":0.195,"cy":0.467,"S":"89,26,140","r0":0.434,"aS":0.955,"T":"229,196,255","tx":0.188,"ty":0.586,"t0":1.004,"t1":1.734,"aT":0.948,"B":"217,169,255","bx":-0.073,"by":-0.273,"b0":0.661,"b1":1.448,"aB":0.82,"tw":0.437,"tk":0.798,"bw":0.097,"bk":0.891,"R0":"255,253,245","w0":0.079,"a0":0.996,"RT":"146,89,255","yT":0.02,"wT":0.02,"aRT":0.758,"RB":"210,158,255","yB":0.223,"wB":0.135,"aRB":1},"halo":{"c":"192,114,255","b1":5.9,"a1":0.458,"b2":18.8,"a2":0.628},"icon":{"off":"248,248,251","lit":"252,250,253"}} },   // 313 degrees
  // For other households. Quiet: strength 0.40 to 0.55, as heather is softer than the others.
  sage:       { soft: '153,189,159', deep: '136,187,146', orb: {"off":{"C0":"70,79,73","C1":"0,0,0","p":0.783,"p1":1.183,"cx":0.139,"cy":0.077,"S":"3,5,2","r0":0.459,"aS":0.218,"T":"209,224,210","tx":0.462,"ty":0.771,"t0":1.043,"t1":2.347,"aT":0.984,"B":"213,230,212","bx":-0.03,"by":-0.354,"b0":0.836,"b1":1.718,"aB":0.851,"tw":0.314,"tk":0.866,"bw":0.076,"bk":0.925,"R0":"1,0,1","w0":0.025,"a0":1,"RT":"247,253,251","yT":0.041,"wT":0.07,"aRT":0.793,"RB":"246,255,255","yB":0.141,"wB":0.128,"aRB":0.294},"lit":{"C0":"92,104,94","C1":"104,117,107","p":0.083,"p1":1.04,"cx":0.49,"cy":0.06,"S":"26,32,14","r0":0.536,"aS":0.688,"T":"224,240,229","tx":0.203,"ty":0.547,"t0":0.772,"t1":1.745,"aT":1,"B":"211,237,223","bx":-0.073,"by":-0.278,"b0":0.694,"b1":1.372,"aB":0.999,"tw":0.044,"tk":0.942,"bw":0.02,"bk":0.816,"R0":"53,54,9","w0":0.02,"a0":0.877,"RT":"251,255,255","yT":0.052,"wT":0.084,"aRT":0.914,"RB":"246,254,252","yB":0.248,"wB":0.147,"aRB":0.969},"halo":{"c":"137,158,140","b1":5.6,"a1":0.933,"b2":19.1,"a2":0.892},"icon":{"off":"231,242,234","lit":"237,246,241"}} },  // 150 degrees, strength 0.40
  clay:       { soft: '212,155,129', deep: '214,137,102', orb: {"off":{"C0":"85,65,57","C1":"8,2,1","p":0.716,"p1":1.201,"cx":0.155,"cy":0.18,"S":"2,1,0","r0":0.529,"aS":0.134,"T":"227,186,167","tx":0.372,"ty":0.701,"t0":0.871,"t1":2.089,"aT":1,"B":"218,169,151","bx":-0.044,"by":-0.213,"b0":0.776,"b1":1.446,"aB":0.613,"tw":0.126,"tk":0.907,"bw":0.097,"bk":0.935,"R0":"52,21,24","w0":0.174,"a0":0.151,"RT":"245,240,221","yT":0.041,"wT":0.065,"aRT":1,"RB":"232,219,192","yB":0.293,"wB":0.216,"aRB":0.296},"lit":{"C0":"120,94,83","C1":"229,203,185","p":0.899,"p1":1.364,"cx":0.094,"cy":-0.336,"S":"63,28,16","r0":0.597,"aS":0.768,"T":"234,206,193","tx":0.188,"ty":0.484,"t0":0.719,"t1":1.652,"aT":1,"B":"226,187,169","bx":-0.129,"by":-0.251,"b0":0.781,"b1":1.355,"aB":1,"tw":0.17,"tk":0.9,"bw":0.19,"bk":0.967,"R0":"82,38,23","w0":0.02,"a0":0.973,"RT":"255,255,255","yT":0.043,"wT":0.082,"aRT":1,"RB":"252,251,247","yB":0.228,"wB":0.172,"aRB":0.594},"halo":{"c":"179,134,118","b1":19.3,"a1":0.816,"b2":5.3,"a2":0.797},"icon":{"off":"239,226,216","lit":"245,238,230"}} },  // 45 degrees, strength 0.55
  denim:      { soft: '116,144,206', deep: '83,118,201', orb: {"off":{"C0":"49,53,68","C1":"110,114,141","p":0.539,"p1":1.254,"cx":0.147,"cy":0.414,"S":"29,32,46","r0":0.404,"aS":0.73,"T":"194,195,233","tx":0.285,"ty":0.691,"t0":1.2,"t1":2.048,"aT":0.992,"B":"136,140,171","bx":-0.136,"by":-0.482,"b0":1.008,"b1":1.697,"aB":1,"tw":0.194,"tk":0.658,"bw":0.163,"bk":0.684,"R0":"137,88,128","w0":0.021,"a0":0.466,"RT":"242,248,249","yT":0.047,"wT":0.088,"aRT":0.549,"RB":"175,181,200","yB":0.244,"wB":0.117,"aRB":0.557},"lit":{"C0":"87,89,123","C1":"252,243,231","p":0.874,"p1":1.273,"cx":-0.155,"cy":0.008,"S":"5,37,92","r0":0.686,"aS":0.678,"T":"219,210,242","tx":0.254,"ty":0.659,"t0":0.874,"t1":1.84,"aT":1,"B":"223,214,243","bx":-0.047,"by":-0.341,"b0":0.884,"b1":1.405,"aB":1,"tw":0.243,"tk":0.755,"bw":0.36,"bk":0.885,"R0":"29,61,144","w0":0.029,"a0":0.971,"RT":"254,254,251","yT":0.049,"wT":0.098,"aRT":0.797,"RB":"253,254,254","yB":0.087,"wB":0.122,"aRB":0.569},"halo":{"c":"152,144,208","b1":7.7,"a1":0.711,"b2":21.6,"a2":0.594},"icon":{"off":"218,217,239","lit":"233,227,245"}} },   // 265 degrees, strength 0.60
  sand:       { soft: '196,177,147', deep: '196,171,129', orb: {"off":{"C0":"79,76,69","C1":"0,0,0","p":0.783,"p1":1.183,"cx":0.139,"cy":0.077,"S":"7,4,2","r0":0.459,"aS":0.218,"T":"226,218,206","tx":0.462,"ty":0.771,"t0":1.043,"t1":2.347,"aT":0.984,"B":"233,222,208","bx":-0.03,"by":-0.354,"b0":0.836,"b1":1.718,"aB":0.851,"tw":0.314,"tk":0.866,"bw":0.076,"bk":0.925,"R0":"0,0,1","w0":0.025,"a0":1,"RT":"252,251,247","yT":0.041,"wT":0.07,"aRT":0.793,"RB":"251,254,247","yB":0.141,"wB":0.128,"aRB":0.294},"lit":{"C0":"105,100,90","C1":"118,112,102","p":0.083,"p1":1.04,"cx":0.49,"cy":0.06,"S":"39,26,17","r0":0.536,"aS":0.688,"T":"241,235,222","tx":0.203,"ty":0.547,"t0":0.772,"t1":1.745,"aT":1,"B":"236,229,210","bx":-0.073,"by":-0.278,"b0":0.694,"b1":1.372,"aB":0.999,"tw":0.044,"tk":0.942,"bw":0.02,"bk":0.816,"R0":"73,42,30","w0":0.02,"a0":0.877,"RT":"254,255,251","yT":0.052,"wT":0.084,"aRT":0.914,"RB":"252,252,247","yB":0.248,"wB":0.147,"aRB":0.969},"halo":{"c":"161,150,133","b1":5.6,"a1":0.933,"b2":19.1,"a2":0.892},"icon":{"off":"242,238,230","lit":"245,243,237"}} },  // 80 degrees, strength 0.42
  // The household's four waste bins, measured from the live config on 22 Nov 2026 (config_rename_plan.md,
  // "Waste bins from the palette"). They are hand-picked, so no rule makes them. Each has two more values
  // than a pair: `glow` is the icon's drop shadow, and `ink` is the chip label. A palette entry with no
  // `glow` has a glow equal to its deep tone, and one with no `ink` has the tint of its deep tone
  // (lamplight-waste reads both). soft is the icon and the dot, deep is the chip fill and border.
  grape:      { soft: '180,100,255', deep: '180,100,255', glow: '220,189,249', ink: '#e4ccff' },   // Food
  mustard:    { soft: '234,219,178', deep: '229,177,34',  ink: '#f0e3c4' },                        // Normal
  bluebell:   { soft: '159,206,244', deep: '52,153,237',  ink: '#c3ddf7' },                        // Paper
  mint:       { soft: '173,244,216', deep: '52,237,163',  ink: '#c4f7e2' }                         // Glass & Plastics
};

// ── SECTION 2 · THE MEANINGS (RESERVED) ──────────────────────────────────────────────────────
// A card reads a meaning as LAMP_MEANINGS.group.key. A config writes it as group-key.
const LAMP_MEANINGS = {
  // A window is open. The same sky in every room (d-029).
  window: { open: '60,200,235' },
  // Nothing to report: a foot panel at rest, the waste panel with no future date (§05).
  panel: { rest: '143,160,189' },
  // Quiet ink on the page ground, outside a panel (Law 07.1).
  page: { ink: '143,160,189' },
  // The plug's light: one amber in every room, never the room accent (d-172). It was the gold 239,160,0
  // until 0.145.0-dev; on 22 Nov 2026 the household found it yellowish and chose the plates' own amber.
  plug: { light: '250,152,30' },
  // A counter on the rooms card that needs a look. An open window is not one: it takes window-open.
  attention: { mark: '235,120,70' },
  // The battery bands and the battery mark (d-135, d-152).
  battery: { alert: '235,120,70', notice: '232,195,74', hand: '78,200,130', full: '78,200,130' },
  // The purifier's filter: the bands of the sheet and the alert of the hero.
  filter: { alert: '235,120,70', notice: '232,195,74', hand: '78,200,130' },
  // The comfort word of a climate row (d-159).
  comfort: { cool: '90,150,245', warm: '235,120,70', comfortable: '78,200,130' },
  // Which way the air feels on #today: periwinkle colder, warm amber warmer (29 Oct 2026).
  felt: { colder: '172,166,250', warmer: '240,180,120' },
  // The humidity ramp: dry, middle, wet. Three [r, g, b] stops, not one colour.
  // The dry stop is silver, OKLCH L 0.75 C 0.025 h 240: the lightness of the middle stop, with
  // almost no colour. Until 0.156.0-dev it was 107,143,166 (L 0.63), too faint under 50%.
  humidity: { ramp: [[160, 176, 188], [82, 191, 230], [69, 209, 250]] },
  // WEATHER STATUS (§11). The CAP severity scale, not a provider's words. lampWeatherStatus()
  // turns the provider's level into a status. The screen keeps the provider's own words.
  // Two sets, by the household's decision of 22 Nov 2026:
  //   sky    the weather card, on its painted sky. chip: the chip colour. foot: the wash at the
  //          card's foot, "r,g,b,a". rim: the rim takes the chip colour. ink: the letters on a
  //          tinted chip (6.6, 6.4, 6.0:1, Law 13.1).
  //   sheet  every other card (the Day Card, the windows sheets), on the dark ground. w: the
  //          colour. ink: the text colour; each card sets its own alpha.
  // notice is bad weather with no warning (rain, snow, cold). It is a separate meaning from
  // moderate, although the two have the same value today.
  weather: {
    notice:   { sheet: { w: '232,195,74', ink: '242,217,138' } },
    moderate: { sky: { chip: '255,200,66', foot: '5,8,18,0.52',  rim: false, ink: '255,200,66' },
                sheet: { w: '232,195,74', ink: '242,217,138' } },
    severe:   { sky: { chip: '255,140,52', foot: '62,28,4,0.66', rim: true,  ink: '255,176,120' },
                sheet: { w: '240,150,60', ink: '246,199,154' } },
    extreme:  { sky: { chip: '255,72,64',  foot: '60,6,10,0.72', rim: true,  ink: '255,150,142' },
                sheet: { w: '255,90,80',  ink: '255,176,170' } }
  }
};

// The CSS colour names. A palette name never is one. A config that writes one gets an error,
// because the user expects the CSS colour and would get something else without a message.
const LAMP_CSS_NAMES = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black ' +
  'blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral ' +
  'cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen ' +
  'darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon ' +
  'darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink ' +
  'deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ' +
  'ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory ' +
  'khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
  'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen ' +
  'lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen ' +
  'magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen ' +
  'mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream ' +
  'mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
  'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum ' +
  'powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen ' +
  'seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan ' +
  'teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen transparent ' +
  'currentcolor').split(' '));

// Read a colour from a config. `tone` is the tone that the card uses: 'soft' (the default) or
// 'deep'. It applies to a palette name only. The result is "r,g,b".
function lampColour(v, tone) {
  if (typeof v !== 'string') throw new Error('a colour must be a string: ' + v);
  const s = v.trim();
  const p = s.match(/^([a-z]+)(?:\.(soft|deep))?$/);
  if (p && LAMP_PALETTE[p[1]]) return LAMP_PALETTE[p[1]][p[2] || tone || 'soft'];
  const r = s.match(/^([a-z]+)-([a-z]+)$/);
  if (r) {
    const g = LAMP_MEANINGS[r[1]], e = g && g[r[2]];
    if (typeof e === 'string') return e;
    if (e && e.sheet) return e.sheet.w;
    if (e) throw new Error('"' + s + '" is a set of colours, not one colour');
    throw new Error('"' + s + '" is not a reserved colour. Reserved: ' + lampReservedNames().join(', '));
  }
  // A word of 3 or 6 hex letters is a hex colour without its "#", as before.
  if (p && !p[2] && !/^([0-9a-f]{3}|[0-9a-f]{6})$/.test(s)) {
    if (LAMP_CSS_NAMES.has(p[1])) {
      throw new Error('"' + s + '" is a CSS colour name, which Lamplight does not use. ' +
        'Write "r,g,b" or a palette name: ' + Object.keys(LAMP_PALETTE).join(', '));
    }
    throw new Error('"' + s + '" is not a palette colour. Palette: ' + Object.keys(LAMP_PALETTE).join(', '));
  }
  return lampAccent(s);
}

// The reserved names that are one colour, as a config writes them.
function lampReservedNames() {
  const out = [];
  Object.keys(LAMP_MEANINGS).forEach(function (g) {
    Object.keys(LAMP_MEANINGS[g]).forEach(function (k) {
      const e = LAMP_MEANINGS[g][k];
      if (typeof e === 'string' || (e && e.sheet)) out.push(g + '-' + k);
    });
  });
  return out;
}

// WEATHER STATUS ADAPTERS. An adapter reads a provider's warning and gives two things:
//   status  a status of LAMP_MEANINGS.weather (moderate, severe or extreme). It sets the colour.
//   label   the provider's own word for the level. The screen shows it ("YELLOW").
// A provider that is not here can be added beside metoffice. Before an adapter depends on a
// provider's CAP mapping, confirm it.
const LAMP_WEATHER_ADAPTERS = {
  // The Met Office warning sensor's state starts with its level: "Yellow warning of wind".
  // An unknown word is read as yellow, as before.
  metoffice: function (state) {
    const w = String(state || '').split(' ')[0].toLowerCase();
    const status = { yellow: 'moderate', amber: 'severe', red: 'extreme' }[w];
    return status ? { status: status, label: w } : { status: 'moderate', label: 'yellow' };
  }
};

function lampWeatherWarning(state, provider) {
  return (LAMP_WEATHER_ADAPTERS[provider || 'metoffice'] || LAMP_WEATHER_ADAPTERS.metoffice)(state);
}

function lampWeatherStatus(state, provider) { return lampWeatherWarning(state, provider).status; }

// True when the value is a palette name, with or without a tone.
function lampIsPalette(v) {
  const p = typeof v === 'string' && v.trim().match(/^([a-z]+)(?:\.(soft|deep))?$/);
  return !!(p && LAMP_PALETTE[p[1]]);
}

// For a key that has always taken any CSS colour (a chip's icon_color): a palette or reserved
// name becomes "rgb(r,g,b)", and anything else is used as it is written, alpha included.
function lampCssColour(v, tone) {
  const s = String(v).trim();
  return (lampIsPalette(s) || /^[a-z]+-[a-z]+$/.test(s)) ? 'rgb(' + lampColour(s, tone) + ')' : s;
}
