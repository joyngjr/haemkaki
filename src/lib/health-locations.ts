export type LocationType = "hospital" | "pharmacy" | "polyclinic";

export type HealthLocation = {
  id: string;
  name: string;
  address: string;
  type: LocationType;
  lat: number;
  lng: number;
};

export const healthLocations: HealthLocation[] = [
  // Hospitals (red)
  {
    id: "h1",
    name: "Singapore General Hospital",
    address: "Outram Road, Singapore 169608",
    type: "hospital",
    lat: 1.2786,
    lng: 103.8347,
  },
  {
    id: "h2",
    name: "Tan Tock Seng Hospital",
    address: "11 Jalan Tan Tock Seng, Singapore 308433",
    type: "hospital",
    lat: 1.3209,
    lng: 103.846,
  },
  {
    id: "h3",
    name: "Changi General Hospital",
    address: "2 Simei Street 3, Singapore 529889",
    type: "hospital",
    lat: 1.3406,
    lng: 103.9492,
  },
  {
    id: "h4",
    name: "Khoo Teck Puat Hospital",
    address: "90 Yishun Central, Singapore 768828",
    type: "hospital",
    lat: 1.4249,
    lng: 103.8391,
  },
  {
    id: "h5",
    name: "National University Hospital",
    address: "5 Lower Kent Ridge Road, Singapore 119074",
    type: "hospital",
    lat: 1.2944,
    lng: 103.7834,
  },
  {
    id: "h6",
    name: "KK Women's and Children's Hospital",
    address: "100 Bukit Timah Road, Singapore 229899",
    type: "hospital",
    lat: 1.3106,
    lng: 103.8447,
  },
  {
    id: "h7",
    name: "Ng Teng Fong General Hospital",
    address: "1 Jurong East Street 21, Singapore 609606",
    type: "hospital",
    lat: 1.3346,
    lng: 103.7436,
  },
  {
    id: "h8",
    name: "Sengkang General Hospital",
    address: "110 Sengkang East Way, Singapore 544886",
    type: "hospital",
    lat: 1.3948,
    lng: 103.893,
  },

  // Polyclinics (blue)
  {
    id: "p1",
    name: "Bedok Polyclinic",
    address: "11 Bedok North Street 1, Singapore 469662",
    type: "polyclinic",
    lat: 1.3255,
    lng: 103.9296,
  },
  {
    id: "p2",
    name: "Ang Mo Kio Polyclinic",
    address: "21 Ang Mo Kio Central 2, Singapore 569666",
    type: "polyclinic",
    lat: 1.3746,
    lng: 103.8459,
  },
  {
    id: "p3",
    name: "Hougang Polyclinic",
    address: "89 Hougang Avenue 4, Singapore 538829",
    type: "polyclinic",
    lat: 1.3716,
    lng: 103.8931,
  },
  {
    id: "p4",
    name: "Jurong Polyclinic",
    address: "190 Jurong East Avenue 1, Singapore 609788",
    type: "polyclinic",
    lat: 1.3496,
    lng: 103.7231,
  },
  {
    id: "p5",
    name: "Bukit Batok Polyclinic",
    address: "50 Bukit Batok West Avenue 3, Singapore 659164",
    type: "polyclinic",
    lat: 1.3591,
    lng: 103.7517,
  },
  {
    id: "p6",
    name: "Clementi Polyclinic",
    address: "451 Clementi Avenue 3, Singapore 129955",
    type: "polyclinic",
    lat: 1.3162,
    lng: 103.7649,
  },
  {
    id: "p7",
    name: "Woodlands Polyclinic",
    address: "10 Woodlands Street 31, Singapore 738579",
    type: "polyclinic",
    lat: 1.4382,
    lng: 103.788,
  },

  // Pharmacies (green)
  {
    id: "ph1",
    name: "Guardian – ION Orchard",
    address: "2 Orchard Turn, #B4-02, ION Orchard, Singapore 238801",
    type: "pharmacy",
    lat: 1.304,
    lng: 103.8318,
  },
  {
    id: "ph2",
    name: "Watsons – Tampines Mall",
    address: "4 Tampines Central 5, #B1-07/08, Singapore 529510",
    type: "pharmacy",
    lat: 1.3536,
    lng: 103.944,
  },
  {
    id: "ph3",
    name: "Guardian – IMM",
    address: "2 Jurong East Street 21, #01-57, Singapore 609601",
    type: "pharmacy",
    lat: 1.3346,
    lng: 103.7436,
  },
  {
    id: "ph4",
    name: "Watsons – VivoCity",
    address: "1 HarbourFront Walk, #B2-15/16/17, Singapore 098585",
    type: "pharmacy",
    lat: 1.264,
    lng: 103.8222,
  },
  {
    id: "ph5",
    name: "Guardian – NorthPoint",
    address: "930 Yishun Avenue 2, #B1-01/02, Singapore 769098",
    type: "pharmacy",
    lat: 1.4297,
    lng: 103.835,
  },
  {
    id: "ph6",
    name: "Watsons – JEM",
    address: "50 Jurong Gateway Road, #B1-07, Singapore 608549",
    type: "pharmacy",
    lat: 1.3331,
    lng: 103.7436,
  },
  {
    id: "ph7",
    name: "Guardian – Parkway Parade",
    address: "80 Marine Parade Road, #B1-147/149, Singapore 449269",
    type: "pharmacy",
    lat: 1.3016,
    lng: 103.906,
  },
];
