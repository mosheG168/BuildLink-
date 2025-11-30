export const SKILL_OPTIONS = Object.freeze([
  "חשמל / Electrical",
  "אינסטלציה / Plumbing",
  "ריצוף / Tiling",
  "טיח / Plastering",
  "צביעה / Painting",
  "נגרות / Carpentry",
  "אלומיניום / Aluminum",
  "מסגרות / Metalwork",
  "איטום / Sealing",
  "עבודות גבס / Drywall",
  "שפכטל / Spackling",
  "קונסטרוקציה / Framing",
  "מיזוג אוויר / HVAC",
  "גינון / Landscaping",
  "התקנת דלתות / Door Installation",
  "התקנת חלונות / Window Installation",
  "מערכות אבטחה / Security Systems",
  "רשתות תקשורת / Networking",
  "שיפוץ גגות / Roofing",
  "התקנת מעליות / Elevator Installation",
]);

export const SERVICE_OPTIONS = Object.freeze([
  "שיפוצים כלליים / General Renovation",
  "בניה קלה / Light Construction",
  "מטבחים / Kitchens",
  "חדרי רחצה / Bathrooms",
  "הרחבות / Additions",
  "שלד / Shell",
  "גמר / Finishing",
  "תחזוקה / Maintenance",
  "שירותי חירום / Emergency Services",
  "בדק בית / Home Inspection",
  "פינוי פסולת / Waste Removal",
  "הדברה / Pest Control",
  "התקנת מערכות סולאריות / Solar Installation",
]);

export const JOBTYPE_OPTIONS = Object.freeze([
  "מגורים / Residential",
  "מסחרי / Commercial",
  "פרטי / Private",
  "ציבורי / Public",
  "דירות / Apartments",
  "וילות / Villas",
]);

export const LICENSE_OPTIONS = Object.freeze([
  "קבלן רשום / Licensed Contractor",
  "חשמלאי מוסמך / Certified Electrician",
  "אינסטלטור מוסמך / Certified Plumber",
  "מהנדס בניין / Structural Engineer",
  "אדריכל / Architect",
  "מפקח בניה / Building Inspector",
]);

export const AREAS_IL = Object.freeze([
  "גוש דן / Gush Dan",
  "מרכז / Center",
  "שרון / Sharon",
  "שפלה / Shfela",
  "ירושלים / Jerusalem",
  "חיפה / Haifa",
  "צפון / North",
  "דרום / South",
  "גליל עליון / Upper Galilee",
  "גליל מערבי / Western Galilee",
  "עמק יזרעאל / Jezreel Valley",
  "בקעת הירדן / Jordan Valley",
  "נגב / Negev",
  "אילת / Eilat",
  "כל הארץ / all israel",
]);

export const PROFILE_OPTIONS = {
  SKILL_OPTIONS,
  SERVICE_OPTIONS,
  JOBTYPE_OPTIONS,
  LICENSE_OPTIONS,
  AREAS_IL,
};
export default PROFILE_OPTIONS;
