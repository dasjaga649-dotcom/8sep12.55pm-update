export type GifOverride = { url?: string; query?: string; link?: string; title?: string };
export type GifOverridesMap = Record<string, GifOverride[]>;

// Customize cartoon/professional GIFs per keyword
// Only used when the specific keyword is present in the user text/answer
export const gifOverrides: GifOverridesMap = {
  // 🏢 General Office
  office: [{ url: "https://media.tenor.com/WR44thrgZBkAAAAj/pengu-pudgy.gif" }],
  offices: [{ url: "https://media.tenor.com/nN_AReiu27sAAAAi/penguin-computer.gif" }],
  headquarters: [{ url: "https://media1.tenor.com/m/01iaetuXPUwAAAAC/stealth-business-work.gif" }],
  branch: [{ url: "https://media.giphy.com/media/3o6Zt62PeJeFUDwBUI/giphy.gif" }],
  workspace: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWY5cXNocDV6YjhobnpqenI3cGZmMWQ2a20xdHl4a3RuNmNjazA3ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5xaOcLSjCuroxKfZ4yI/giphy.gif" }],
  work: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHl4aHF6cTFrOGxsMzNxYnFzMDFvdXVxMHJ3cWw0b3V4NXVnaG4xeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nCVVpakhBTwBi/giphy.gif" }],
  team: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExejE5eXJxZXcwMWlwZjU2enI3dDhlYnJrM294NnZhcWFlMWppZWdmYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BNB5ckWQ00JTTYZjIQ/giphy.gif" }],
  employee: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDFncmc5dmUzZ2UzZWhwZTBkdG1iMXQzNmo2eTN4ZXQyZXI5ZWlsNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bu0dFukC1MT5hLqQ2U/giphy.gif" }],
  staff: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmNtNWVrZzBmdndlb3Q1MjRjYzhzbjYwczUyNXd3bjNyMGY1ODRpOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KpcQqggw48MtpPiKDK/giphy.gif" }],
  colleagues: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmNtNWVrZzBmdndlb3Q1MjRjYzhzbjYwczUyNXd3bjNyMGY1ODRpOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KpcQqggw48MtpPiKDK/giphy.gif" }],

  // 📊 Meetings & Collaboration
  meeting: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2J6Y3VsejR3MjA1dHZod282NzFmbjRhdzA5MXp4MDFlaHRzN3gxNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6MbiSDt6PKFUyrlK/giphy.gif" }],
  conference: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZXU5OTRkZWxwYmh1M3dvdmJwdXY3MXoxdjU4MzM0M3p0bmR4b2RkbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oz8xIXoxGD8r3lzQQ/giphy.gif" }],
  boardroom: [{ url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjZ6bmVwdWZ4YWs1bm42M3gxa2hlOG5tNG4weG0yMXNibjRjc3ViaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/48tsaAibt19ldQyCby/giphy.gif" }],
  presentation: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNml2bDI0dHR6bGFxYzMzcGx3OWp0Ym12bGQ2bmxyamVtYjZ0MzF4cSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/febzlrF4PAt7dHC5Jv/giphy.gif" }],
  brainstorming: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnd2a3JkejN5b2d6eWl1dThkM3k2dWJiZ2VtbXhnazhvNjJkNGxyOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/4uqzppohCKBz8pie0r/giphy.gif" }],
  discussion: [{ url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcW8zYXNvc3B2ZjJ4NnVwbml4YTc3ZWQ2dW85Zm1mMXZwOHc3ZjQwZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ii4ocX1W3BeAn3KHFM/giphy.gif" }],
  collaboration: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2Z0NDhxMjBnZnZ6enJhZDhrMWhoemYwb2prd3BhaXY0cHNncDMzaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZOWojGSxaka2H5S0eS/giphy.gif" }],

  // 💻 IT & Software
  software: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjYzZHU0ZDY4eDk1bHZoazllbHBqdWw2cjR5YXVtN2Jtb2c5MmxtcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bGgsc5mWoryfgKBx1u/giphy.gif" }],
  development: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXM2Z2JnMmlpajByNzk1MHN6aWFlNTNwZzR3czZ5dGxzeHZqMThiNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tn33aiTi1jkl6H6/giphy.gif" }],
  coding: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnQ1Y2xnZ3FlZ253MjE2MWU3YXRka3EwbXEyazdidWRtbTl3YXg0ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif" }],
  programming: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3FmamNtZnVieHFhYmM3ZzNkejlpYzV1M3BiMm00cTN3NGt2aDh5ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/11kEuHSQAXXiGQ/giphy.gif" }],
  technology: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjVnNm44YnQxcHB0NW8waGJndXU3ejl3cG5sNWZldDM0MDNqeXo0OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/OFz7vWJ5CudCDpGLG5/giphy.gif" }],
  innovation: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AzbjQ1c3V0NWE1NGg2Y3FpMmt3MDg0MXJsYTFoamtyOWc5cDA1NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZbOJHSRcz1Gn95PXpO/giphy.gif" }],
  digital: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnF3bHNtbnd6aWtpaTNkaDl3OHZkZHFuenAyN2F1bWFydnQyaGhmMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rm3cJx7OmvFWld8bM0/giphy.gif" }],
  IT: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGRoeXZ0ZHVrc2twM2RxYmM5Z3o3ZHMzMnkxZHBvd256M2toa3NyayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MD0svLSDeudszrNrp0/giphy.gif" }],
  project: [{ url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGlpNHN0cnA4YTk5NzB3MWFsa3FxN2xwdW9iaDJiZjZ6dHhzMDQzOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9xmjP6FkdINCA6Ucp4/giphy.gif" }],
  solution: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDhuaWlqaXhrbWpkN25wOTQyNmpid29qZXZmYjhtYW1zdnYyNXk4MyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/qJPLXOia4xsZwbKNPV/giphy.gif" }],

  // 🎯 Services
  service: [{ url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW0yZGV3ZGJoMmF0NHA5dnRoaHN2OG0zaW5iY2Z0MW5zempjMjNhaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BuGi0FwZtMssO9Qfu8/giphy.gif" }],
  services: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmtxbDB5cDV6N2NpYXRhYTVpcm9qZTczemFoNGFsN3VnN3RyOHFiYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ukweextKgAdQDT4yuF/giphy.gif" }],
  consulting: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExem94MGl4YWdkNTdkZjAyNGphaXZ0NjFoMjB2ZGprcGpwMGwwdmVxOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bL8zk90tTqdObE5R1H/giphy.gif" }],
  support: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTc1cXA5OWVzZ3V2bTFmdzJ5NDBrZDMxZDE5ZWJrcXh4YzlwaDZycCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/oS5fDVGDnr68rTVQLV/giphy.gif" }],

  // 📍 Locations
  location: [{ url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW55bnFnenBza3FodjE5ZzhycmpocmtsOXgxbWJzbWQyaDNhNXp1cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2GYYUGsLShvqRCWycQ/giphy.gif" }],
  address: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjNmbmM0MnU3MXc0YjQ5dXo2MHN0c2JmdWRnbzc0bDMxZWh5MnY3MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/oXPosUuQ5J8WdugjLg/giphy.gif" }],
  building: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHJuMWh2eHN0cXdwNTdmMm9lajE3Z2lwam1vZ2NxYXVnNnJ1ZnlpdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/geSnRnLiLYKUbQ8ODK/giphy.gif" }],
  tower: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTVzdjB4N3ZoZDVoY2l6OXYyaWY1a3gxa2UwM3FnNDAwdTdpcnp5ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IgHzlsoS7dA7B7XEHc/giphy.gif" }],

  // 👨‍💼 Roles
  ceo: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjM0bzEyNnZxNGJpdjBrY2g5dHVycTlhYTdlY29idm9ucnYzY3dxeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wF5HuqrRNtYBCL4Exz/giphy.gif" }],

  // 🖥️ Office Items
  laptop: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2FmY3pwM2p3anVtenhvNHBxZWZiZG11bHhvd3gya3ZhY3RqYmJueSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/pOZhmE42D1WrCWATLK/giphy.gif" }],

  // 🚀 Growth & Business
  growth: [{ url: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZXNvMmhucnYxd3NleTcweDdxbTg5amh0OHo3bzM5bXh1c3FsczhxeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CTBcE6ZXlDrt469j37/giphy.gif" }],
  future: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2QwZjF3bXJucGZkbHc5aHNpdXg3bTV0dTRxcmpwYWR4NDZqNzljYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9iv4ErObYQvrW/giphy.gif" }],
  transformation: [
    { url: "https://cdn.dribbble.com/userupload/24196325/file/original-3f82867ec644cb6fef84c18adcca7ce6.gif" },
    { url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmUyOWlraTJqMno0NDRsdXJ0NHdzZjdwejEzMzBvMWl1aHpuYnF2cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2JhH8cQERbtYalHO/giphy.gif" }
  ],
  business: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXRiZnNpNXNkdHl1bTEzMmg0dG40ZXRicHBwMGIwN3Q5dnRoeXg2eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VkMV9TldsPd28/giphy.gif" }],
  startup: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXRiZnNpNXNkdHl1bTEzMmg0dG40ZXRicHBwMGIwN3Q5dnRoeXg2eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/b0L0WqA8cUpQ4/giphy.gif" }],

  // ☁️ Cloud & Security & Data
  cloud: [{ url: "https://media.licdn.com/dms/image/v2/D5612AQELxiSEZX2wpw/article-cover_image-shrink_423_752/article-cover_image-shrink_423_752/0/1718172474292?e=1759968000&v=beta&t=c9qWFs9aUeLPsm6KL6AGVSLprKc5STRMOXCdn9PXbIw" }],
  cybersecurity: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXNobm10NWpzaDl0MDUzcnBqN3dod2ZlYXpjeThyeGg1aGVtaXo4ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/RDZo7znAdn2u7sAcWH/giphy.gif" }],
  database: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZXdya2x5bmxpejh1MnhteW9oYmJiY205andsaDQxN3pudncyenZzYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sRFEa8lbeC7zbcIZZR/giphy.gif" }],

  // 🤖 AI & Automation & DevOps
  ai: [{ url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDl1Z3I3c3d1djc5MmV4MzFyem0zZTFqd295N2MxYm9qM3R1YnkzcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5k5vZwRFZR5aZeniqb/giphy.gif" }],
  machinelearning: [{ url: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGNyaXZnZHdtM2ZrZm90MGQ3aGEwMjdlNm9yZXF4YmliMXZleGphZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sIBJGYlTr2QBLcUPVi/giphy.gif" }],
  automation: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGI2czU4MGJxa3ljMHB3ZmltcGlldG8zZzgzcHMyZGhrd2U2dG4zNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sLR1eJP1vBV8w3qHHx/giphy.gif" }],
  devops: [{ url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGNqZ3FnMThuMnB2ZHRjdzVwZm9ka3Bmcmo5NjgxZ2xzYTdmMmR4cSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sGIxhunddTUOHlHXgu/giphy.gif" }],
  debugging: [{ url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExanNua3BtYTg3bHE1dmFxejdibHRkZHdmMW1paTQ5cGRreWJyNzBvbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/efuh1hLg1H438esuwG/giphy.gif" }],
  analytics: [{ url: "https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif" }]
};

const overrides: GifOverridesMap = gifOverrides;
export default overrides;
