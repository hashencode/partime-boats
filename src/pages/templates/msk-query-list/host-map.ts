const HOST_GROUPS: { host: string; destinationcity_name: string[] }[] = [
  { host: '西非基本港', destinationcity_name: ['ONNE', 'LOME', 'APAPA', 'TEMA', 'TINCAN', 'LAGOS', 'COTONOU', 'ABIDJAN'] },
  { host: '西非北港', destinationcity_name: ['DAKAR', 'CONAKRY', 'BANJUL', 'NOUADHIBOU', 'MONROVIA', 'FREETOWN', 'NOUAKCHOTT', 'PRAIA', 'TIN CAN ISLAND PORT'] },
  { host: '西非南港', destinationcity_name: ['LUANDA', 'MATADI', 'DOUALA', 'POINTE NOIRE', 'LIBREVILLE', 'BATA', 'WALVIS BAY', 'KRIBI'] },
  {
    host: '南非',
    destinationcity_name: ['CAPE TOWN', 'MASERU', 'DURBAN', 'JOHANNESBURG', 'BLANTYRE', 'MATSAPHA', 'PORT LOUIS', 'MAPUTO', 'GABORONE', 'BEIRA', 'HARARE'],
  },
  {
    host: '中红印',
    destinationcity_name: [
      'SALALAH', 'ADEN', 'HODEIDAH', 'CHITTAGONG', 'BEKASI', 'JEBEL ALI', 'COLOMBO', 'KARACHI', 'JAWAHARLAL NEHRU', 'NHAVA SHEVA', 'DAMMAM', 'BIRGANJ', 'JEDDAH', 'AQABA', 'MUNDRA', 'RIYADH',
    ],
  },
  {
    host: '东非',
    destinationcity_name: ['MOGADISHU', 'BERBERA', 'DJIBOUTI', 'NAIROBI', 'ZANZIBAR', 'LUSAKA', 'MOMBASA', 'DAR ES SALAAM', 'KAMPALA', 'TOAMASINA', 'LILONGWE', 'Dar_Es_Salaam'],
  },
  {
    host: '地中海',
    destinationcity_name: [
      'BEJAIA', 'ASHDOD', 'HAIFA', 'BARCELONA', 'NAPLES', 'LA SPEZIA', 'VALENCIA', 'KOPER', 'RIJEKA', 'PIRAEUS', 'VARNA', 'MERSIN', 'ISKENDERUN', 'IZMIR', 'ALEXANDRIA DEKHEILA', 'THESSALONIKI', 'AMBARLI', 'IZMIT KORFEZI', 'BURGAS',
      'POTI', 'CONSTANTA', 'SOFIA', 'PORT TANGIER', 'CASABLANCA', 'MISURATAH', 'BENGHAZI', 'ORAN', 'ALGIERS PORT', 'ALGECIRAS', 'GIOIA TAURO', 'CASABLANCA RAIL', 'PORT SAID WEST', 'ALEXANDRIA OLD PORT', 'TRIESTE',
      'PORT TANGIER MEDITERRANEE', 'ALEXANDRIA', 'AMBARLI PORT ISTANBUL', 'LEIXOES',
    ],
  },
  { host: '美加', destinationcity_name: ['NEWARK', 'SAVANNAH', 'LONG BEACH', 'OAKLAND', 'LOS ANGELES', 'HOUSTON', 'MIAMI', 'CHICAGO', 'MEMPHIS', 'VANCOUVER', 'TORONTO', 'BALTIMORE', 'CHARLESTON', 'NORFOLK', 'JACKSONVILLE', 'CHARLOTTE', 'MOBILE', 'HALIFAX'] },
  { host: '欧洲', destinationcity_name: ['GDANSK', 'LIVERPOOL', 'FELIXSTOWE', 'ROTTERDAM', 'RIGA', 'HAMBURG', 'ANTWERP', 'LONDON GATEWAY PORT', 'BASEL', 'LE HAVRE', 'BREMERHAVEN', 'ALTENA', 'BODOE', 'GOTHENBURG', 'TALLINN', 'SOUTHAMPTON'] },
  { host: '南美东', destinationcity_name: ['SANTOS', 'BUENOS AIRES', 'ITAPOA', 'MONTEVIDEO', 'VITORIA', 'PARANAGUA', 'MANAUS'] },
  { host: '加勒比', destinationcity_name: ['CAUCEDO', 'CARTAGENA', 'KINGSTON', 'COLON FREE ZONE', 'PUERTO CALDERA', 'SAN JOSE', 'ACAJUTLA', 'CORINTO', 'PARAMARIBO', 'PUERTO CORTES', 'GEORGETOWN', 'PUERTO CABELLO', 'RIO HAINA', 'LA GUAIRA'] },
  { host: '南美西', destinationcity_name: ['CALLAO', 'SAN ANTONIO', 'BUENAVENTURA', 'GUAYAQUIL', 'MALE', 'MANZANILLO,MEXICO', 'TOLUCA', 'MEXICO CITY', 'LAZARO CARDENAS', 'BALBOA', 'ARICA', 'MELNIK'] },
  { host: '澳新', destinationcity_name: ['MELBOURNE', 'SYDNEY', 'BRISBANE'] },
  { host: '东南亚', destinationcity_name: ['JAKARTA', 'SEMARANG', 'HO CHI MINH', 'PORT KLANG', 'HAIPHONG', 'SINGAPORE', 'BANGKOK', 'HO CHI MINH CITY'] },
]

const HOST_BY_DESTINATION = new Map<string, string>()

HOST_GROUPS.forEach((group) => {
  group.destinationcity_name.forEach((name) => {
    HOST_BY_DESTINATION.set(name.toUpperCase(), group.host)
  })
})

export const resolveHostByDestination = (destinationcityName?: string | null): string | null => {
  if (!destinationcityName) return null
  return HOST_BY_DESTINATION.get(destinationcityName.toUpperCase()) ?? null
}
