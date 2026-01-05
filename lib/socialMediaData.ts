// Preloaded social media data for businesses
// This eliminates the need to scrape websites repeatedly
// Format: { [businessName]: { instagram?: string, facebook?: string } }

export type SocialMediaInfo = {
  instagram?: string;
  facebook?: string;
};

export const socialMediaData: Record<string, SocialMediaInfo> = {
  // ============ GEORGE ============
  // Restaurants
  "The Fat Fish George": { instagram: "thefatfish_sa", facebook: "TheFatFishRestaurant" },
  "Old Town Italy George": { instagram: "oldtownitaly", facebook: "OldTownItaly" },
  "The Hussar Grill George": { instagram: "hussargrill", facebook: "HussarGrill" },
  
  // Coffee
  "The Foundry Roasters": { instagram: "foundryroasters", facebook: "FoundryRoasters" },
  "Bootlegger Coffee Co": { instagram: "bootleggercoffee", facebook: "BootleggerCoffee" },
  "Illy Coffee George": { instagram: "illycoffee", facebook: "illycoffee" },
  
  // Stay
  "Protea Hotel King George": { instagram: "proteahotels", facebook: "ProteaHotels" },
  "Fancourt Hotel": { instagram: "fancourt", facebook: "FancourtSA" },
  "The Hawthorn Boutique Hotel": { instagram: "thehawthornhotel", facebook: "TheHawthornHotel" },
  
  // Real Estate
  "Pam Golding Properties George": { instagram: "pamgolding", facebook: "PamGoldingProperties" },
  "Seeff George": { instagram: "seeffpropertygroup", facebook: "SeeffPropertyGroup" },
  "Chas Everitt George": { instagram: "chaseveritt", facebook: "ChasEverittInternational" },
  
  // Car Hire
  "Avis George Airport": { instagram: "aabornevis", facebook: "Avis" },
  "Hertz George Airport": { instagram: "hertz", facebook: "hertz" },
  
  // Healthcare
  "Mediclinic George": { instagram: "mediclinic", facebook: "Mediclinic" },
  "Mediclinic Geneva": { instagram: "mediclinic", facebook: "Mediclinic" },
  
  // Security
  "Fidelity ADT George": { instagram: "faborneidelityservicesgroup", facebook: "FidelityADT" },
  "Garden Route Security (GRS)": { instagram: "gabornerdenroutesecurity", facebook: "GardenRouteSecurity" },
  
  // Pharmacy
  "Dis-Chem Garden Route Mall": { instagram: "discabornehem", facebook: "DisChem" },
  "Clicks Garden Route Mall": { instagram: "clickssa", facebook: "ClicksSA" },
  
  // ============ WILDERNESS ============
  "Seeff Wilderness": { instagram: "seeffpropertygroup", facebook: "SeeffPropertyGroup" },
  "Pam Golding Properties Wilderness": { instagram: "pamgolding", facebook: "PamGoldingProperties" },
  "The Wilderness Hotel": { instagram: "wildernesshotel", facebook: "TheWildernessHotel" },
  "Views Boutique Hotel & Spa": { instagram: "viewsboutiquehotel", facebook: "ViewsBoutiqueHotel" },
  "Salina's Beach Restaurant": { instagram: "salinasbeach", facebook: "SalinasBeachRestaurant" },
  "The Girls on the Square": { instagram: "thegirlswilderness", facebook: "TheGirlsWilderness" },
  "Serendipity Restaurant": { instagram: "serendipitywilderness", facebook: "SerendipityWilderness" },
  "The Commonage Wilderness": { instagram: "thecommonage", facebook: "TheCommonageWilderness" },
  
  // ============ SEDGEFIELD ============
  "Pam Golding Properties Sedgefield": { instagram: "pamgolding", facebook: "PamGoldingProperties" },
  "Seeff Sedgefield": { instagram: "seeffpropertygroup", facebook: "SeeffPropertyGroup" },
  "Sedgefield Arms": { instagram: "sedgefieldarms", facebook: "SedgefieldArms" },
  "The Scarab Village": { instagram: "scarabvillage", facebook: "ScarabVillage" },
  "Slow Roasted Coffee": { instagram: "slowroastedcoffee", facebook: "SlowRoastedCoffee" },
  
  // ============ KNYSNA ============
  "Pam Golding Properties Knysna": { instagram: "pamgolding", facebook: "PamGoldingProperties" },
  "Seeff Knysna": { instagram: "seeffpropertygroup", facebook: "SeeffPropertyGroup" },
  "The Lofts Boutique Hotel": { instagram: "theloftsknysna", facebook: "TheLoftsBoutiqueHotel" },
  "Turbine Hotel & Spa": { instagram: "turbinehotel", facebook: "TurbineHotelSpa" },
  "East Head Cafe": { instagram: "eastheadcafe", facebook: "EastHeadCafe" },
  "34 South": { instagram: "34southknysna", facebook: "34SouthKnysna" },
  "Ile de Pain": { instagram: "iledepain", facebook: "IleDePain" },
  "Drydock Food Co": { instagram: "drydockfoodco", facebook: "DrydockFoodCo" },
  "Knysna Elephant Park": { instagram: "knysnaelephantpark", facebook: "KnysnaElephantPark" },
  "Featherbed Nature Reserve": { instagram: "featherbedco", facebook: "FeatherbedNatureReserve" },
  
  // ============ PLETTENBERG BAY ============
  "Pam Golding Properties Plettenberg Bay": { instagram: "pamgolding", facebook: "PamGoldingProperties" },
  "Seeff Plettenberg Bay": { instagram: "seeffpropertygroup", facebook: "SeeffPropertyGroup" },
  "Beacon Island Resort": { instagram: "beaconislandresort", facebook: "BeaconIslandResort" },
  "The Plettenberg Hotel": { instagram: "theplettenberg", facebook: "ThePlettenbergHotel" },
  "Emily Moon River Lodge": { instagram: "emilymoonriverlodge", facebook: "EmilyMoonRiverLodge" },
  "The Lookout Deck": { instagram: "thelookoutdeck", facebook: "TheLookoutDeck" },
  "Enrico's Restaurant": { instagram: "enricosplett", facebook: "EnricosRestaurant" },
  "Le Fournil de Plett": { instagram: "lefournildeplett", facebook: "LeFournilDePlett" },
  "Monkeyland": { instagram: "monkeyland", facebook: "MonkeylandSA" },
  "Birds of Eden": { instagram: "birdsofeden", facebook: "BirdsOfEden" },
  "Tenikwa Wildlife Centre": { instagram: "tenikwa", facebook: "TenikwaWildlife" },
  
  // ============ MOSSEL BAY ============
  "Pam Golding Properties Mossel Bay": { instagram: "pamgolding", facebook: "PamGoldingProperties" },
  "Seeff Mossel Bay": { instagram: "seeffpropertygroup", facebook: "SeeffPropertyGroup" },
  "Protea Hotel Mossel Bay": { instagram: "proteahotels", facebook: "ProteaHotels" },
  "The Point Hotel": { instagram: "thepointhotel", facebook: "ThePointHotelMosselBay" },
  "Santos Beach Hotel": { instagram: "santosbeachhotel", facebook: "SantosBeachHotel" },
  "Cafe Gannet": { instagram: "cafegannet", facebook: "CafeGannet" },
  "Kaai 4 Restaurant": { instagram: "kaai4", facebook: "Kaai4Restaurant" },
  "Delfinos Restaurant": { instagram: "delfinosmosselbay", facebook: "DelfinosRestaurant" },
  "Bartolomeu Dias Museum": { instagram: "diasmuseum", facebook: "DiasMuseum" },
  
  // ============ OUDTSHOORN ============
  "Pam Golding Properties Oudtshoorn": { instagram: "pamgolding", facebook: "PamGoldingProperties" },
  "Seeff Oudtshoorn": { instagram: "seeffpropertygroup", facebook: "SeeffPropertyGroup" },
  "RE/MAX Unity Oudtshoorn": { instagram: "remaxunity", facebook: "REMAXUnityOudtshoorn" },
  "Buffelsdrift Game Lodge": { instagram: "buffelsdrift", facebook: "BuffelsdriftGameLodge" },
  "De Zeekoe Guest Farm": { instagram: "dezeekoe", facebook: "DeZeekoeGuestFarm" },
  "Queens Hotel Oudtshoorn": { instagram: "queenshotel", facebook: "QueensHotelOudtshoorn" },
  "Hlangana Lodge": { instagram: "hlanganalodge", facebook: "HlanganaLodge" },
  "Jemima's Restaurant": { instagram: "jemimasrestaurant", facebook: "JemimasRestaurant" },
  "De Oude Meul": { instagram: "deoudemeul", facebook: "DeOudeMeul" },
  "Nostalgie Restaurant": { instagram: "nostalgierestaurant", facebook: "NostalgieRestaurant" },
  "Cango Caves": { instagram: "cangocaves", facebook: "CangoCaves" },
  "Safari Ostrich Farm": { instagram: "safariostrich", facebook: "SafariOstrichFarm" },
  "Highgate Ostrich Farm": { instagram: "highgateostrich", facebook: "HighgateOstrichFarm" },
  "Cango Wildlife Ranch": { instagram: "cangowildliferanch", facebook: "CangoWildlifeRanch" },
  "CP Nel Museum": { instagram: "cpnelmuseum", facebook: "CPNelMuseum" },
  "Wilgewandel Holiday Farm": { instagram: "wilgewandel", facebook: "Wilgewandel" },
};

// Helper function to get social media info for a business
export function getSocialMediaInfo(businessName: string): SocialMediaInfo | null {
  return socialMediaData[businessName] || null;
}

// Helper function to check if we have social media data for a business
export function hasSocialMediaData(businessName: string): boolean {
  return businessName in socialMediaData;
}
