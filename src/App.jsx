import React, { useState, useCallback, useEffect } from "react";

const C={teal:"#4CAF8A",coral:"#E85B6A",orange:"#F39A3D",yellow:"#F4C542",blue:"#8ECAD0",dark:"#1F2937",grey:"#F3F4F6",white:"#FFFFFF",greyText:"#9CA3AF",border:"#E5E7EB"};
const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},clear:(k)=>{try{localStorage.removeItem(k);}catch(e){}}};
const DATA_VERSION="v19";
if(LS.get("dataVersion",null)!==DATA_VERSION){["tasks","timeChores","randomChores","completedChores","lastResetDate","lastWeekReset","lastMonthReset","deepClean","declutter","seasonal","yearly","quarterly","speedCleanTime","speedCleanRoom"].forEach(k=>LS.clear(k));LS.set("dataVersion",DATA_VERSION);}
const TODAY=new Date().toISOString().split("T")[0];
const lastReset=LS.get("lastResetDate","");
if(lastReset!==TODAY){const t=LS.get("tasks",null);if(t){LS.set("tasks",t.map(x=>x.category==="Daily"?{...x,completed:false}:x));}LS.set("lastResetDate",TODAY);}
const CURRENT_WEEK=(()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);const w=new Date(d.getFullYear(),0,4);return d.getFullYear()+"-W"+String(1+Math.round(((d-w)/86400000-3+(w.getDay()+6)%7)/7)).padStart(2,"0");})();
const lastWeekReset=LS.get("lastWeekReset","");
if(lastWeekReset!==CURRENT_WEEK){const t=LS.get("tasks",null);if(t){LS.set("tasks",t.map(x=>x.category==="Weekly"?{...x,completed:false}:x));}LS.set("lastWeekReset",CURRENT_WEEK);}
const CURRENT_MONTH=new Date().toISOString().slice(0,7);
const lastMonthReset=LS.get("lastMonthReset","");
if(lastMonthReset!==CURRENT_MONTH){const t=LS.get("tasks",null);if(t){LS.set("tasks",t.map(x=>x.category==="Monthly"?{...x,completed:false}:x));}LS.set("lastMonthReset",CURRENT_MONTH);}
const WEEKDAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_ORDER=["Today","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const ROOMS=["Kitchen","Living Room","Bathroom","Bedroom","Upstairs","Downstairs","Garage","Outdoor","General"];
const RC={"Kitchen":C.orange,"Living Room":C.teal,"Bathroom":C.blue,"Bedroom":C.coral,"Upstairs":C.yellow,"Downstairs":"#B39DDB","Garage":C.yellow,"Outdoor":"#66BB6A","General":C.greyText};
const DC=[C.orange,C.yellow,C.coral,C.teal,C.blue,C.orange,C.yellow,C.coral];
const MOTIVATIONAL_QUOTES=["Every little bit makes your home better!","Progress not perfection!","Small steps lead to big results!","You're building great habits!","A tidy home starts with one task!","Keep going — you're doing amazing!","One chore at a time — you've got this!","Consistency beats perfection every time!","Your future self will thank you!","Done is better than perfect!"];
const ALL_EMOJIS=["🧹","🪣","🪟","🚽","🍳","🍽️","👕","🛏️","🗑️","🌿","🚗","📦","🧽","💡","🪞","🐾","🧴","🪴","🛁","🧺","🪤","🔧","🚿","🧼","🪥"];

const DAYS_SHORT=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL=["January","February","March","April","May","June","July","August","September","October","November","December"];

function ordinal(n){const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
function daySort(d){if(!d)return 999;if(d==="Last day")return 32;if(d.startsWith("Day "))return parseInt(d.replace("Day ",""));const i=DAY_ORDER.indexOf(d);return i>=0?i:50;}
function choreIcon(name){const n=(name||"").toLowerCase();if(/vacuum|hoover|carpet/.test(n))return"🧹";if(/mop|floor|sweep/.test(n))return"🧹";if(/dust|vent|baseboard|blind/.test(n))return"🪣";if(/window|glass/.test(n))return"🪟";if(/toilet|bath|shower|sink|scrub/.test(n))return"🚽";if(/kitchen|counter|stove|oven|microwave|fridge|freezer/.test(n))return"🍳";if(/dish/.test(n))return"🍽️";if(/laundry|iron|fold/.test(n))return"👕";if(/bed|sheet|pillow/.test(n))return"🛏️";if(/trash|recycl|bin|garbage/.test(n))return"🗑️";if(/garden|lawn|mow|weed|outdoor|plant/.test(n))return"🌿";if(/garage|car/.test(n))return"🚗";if(/organiz|declutter|drawer|cupboard|closet/.test(n))return"📦";if(/wipe|clean|sanitiz/.test(n))return"🧽";if(/light|switch/.test(n))return"💡";if(/mirror/.test(n))return"🪞";if(/pet|cat|dog|litter/.test(n))return"🐾";return"🧹";}
function initChecklist(key,data){
  try{
    const ex=LS.get(key,null);
    if(ex){
      const firstVal=Object.values(ex)[0];
      // If old format (array of bools), migrate
      if(Array.isArray(firstVal)){
        const migrated={};
        Object.keys(data).forEach(s=>{
          migrated[s]={items:[...data[s].items],checked:Array.isArray(ex[s])?[...ex[s]]:data[s].items.map(()=>false)};
          // Pad or trim checked to match items length
          while(migrated[s].checked.length<migrated[s].items.length)migrated[s].checked.push(false);
          migrated[s].checked=migrated[s].checked.slice(0,migrated[s].items.length);
        });
        LS.set(key,migrated);return migrated;
      }
      // New format - ensure all sections exist and are valid
      const valid={};
      Object.keys(data).forEach(s=>{
        const sec=ex[s];
        if(sec&&Array.isArray(sec.items)&&Array.isArray(sec.checked)){
          // Ensure checked matches items length
          const checked=[...sec.checked];
          while(checked.length<sec.items.length)checked.push(false);
          valid[s]={items:[...sec.items],checked:checked.slice(0,sec.items.length)};
        }else{
          valid[s]={items:[...data[s].items],checked:data[s].items.map(()=>false)};
        }
      });
      LS.set(key,valid);return valid;
    }
  }catch(e){}
  const state={};
  Object.keys(data).forEach(s=>{state[s]={items:[...data[s].items],checked:data[s].items.map(()=>false)};});
  LS.set(key,state);return state;
}

const QUARTERLY_ITEMS=["Deep clean kitchen appliances","Wash windows and window treatments","Clean air vents and replace HVAC filters","Declutter and donate unused items","Power wash exterior surfaces","Clean and inspect outdoor furniture","Deep clean refrigerator and freezer","Declutter and organize garage or storage areas","Clean and inspect fireplace and chimney","Deep clean carpets and upholstery","Clean and organize closets and storage areas","Deep clean bathroom fixtures and surfaces","Test and replace batteries in smoke detectors","Wash curtains, blinds, or drapes according to care instructions","Power wash siding, decks, patios, and driveways","Wash outdoor cushions and pillows","Inspect and repair any damaged outdoor furniture","Wash shower curtains or doors"];

const QUARTERLY_DATA={
  "Jan / Mar":{color:C.blue,emoji:"❄️",items:QUARTERLY_ITEMS},
  "Apr / Jun":{color:C.coral,emoji:"🌸",items:QUARTERLY_ITEMS},
  "Jul / Sep":{color:C.yellow,emoji:"☀️",items:QUARTERLY_ITEMS},
  "Oct / Dec":{color:C.orange,emoji:"🍂",items:QUARTERLY_ITEMS},
};

const DEEP_CLEAN_DATA={
  Kitchen:{color:C.orange,emoji:"🍳",items:["Wash, Dry & Clean Dishes","Wipe down doors, handles and counter top","Clean Fridge & Freezer — Inside & outside","Wipe down doors/handles/top of the fridge, vacuum coils if accessible","Clean Oven — Inside & Outside","Clean Stove","Clean Microwave — Inside & Outside","Clean range hood — inside and out","Clean Dishwasher — Inside & Outside","Clean Toaster, Coffee Maker, Blender & small appliances","Paper towels or reusable kitchen towels","Empty & clean all shelves and drawers","Clean out cabinets & under sinks","Clean and replace shelf liners if needed","Wipe down cabinet doors, handles, and knobs","Scrub Sink and Faucets with disinfectant or baking soda paste","Sweep thoroughly, including corners and under appliances","Mop with a suitable cleaner for your floor type","Empty and disinfect the trash can inside and out","Dust and wipe down light fixtures and replace burnt-out bulbs","Spot clean stains and grease splatters","Clean windows inside and out","Wash curtains or wipe down blinds","Remove all items and discard expired products","Purge expired items in pantry & fridge","Dispose of old sponges and wash dish towels"]},
  Bathroom:{color:C.yellow,emoji:"🚿",items:["Remove all items from countertops, shelves, and shower/tub","Dispose of expired products and empty containers","Dust light fixtures and remove cobwebs","Wipe down walls, especially in the shower area, to remove soap scum & mildew","Clean windows inside and out with glass cleaner. Wipe down window sills & tracks","Clean mirrors with glass cleaner, ensuring a streak-free finish","Scrub the bathtub with an all-purpose cleaner or a specific tub cleaner","Wash shower curtains and liners or replace them if moldy","Remove and soak the showerhead in vinegar to remove mineral deposits. Scrub with a brush","Wipe down glass doors with glass cleaner or a vinegar solution","Scrub the sink and faucet. Use a toothbrush for small crevices around the faucet","Clear and wipe down countertops","Organize medicine cabinet","Scrub Toilet Bowl with a toilet brush and flush","Wipe down the exterior of the toilet, including the tank, handle & base, with a disinfectant","Clean the seat and lid thoroughly, ensuring all surfaces are disinfected","Sweep and mop floors. Pay attention to edges and corners","Empty cabinets and drawers. Wipe down the interiors with an all-purpose cleaner","Clean out cabinets & under sinks","Remove and clean air vent covers. Dust and vacuum inside the vents if possible","Replace items neatly, discarding expired or unused products","Sweep or vacuum the floor to remove hair and debris","Mop the floor with a suitable cleaner for your floor type","Clean grout lines with a grout cleaner or a mixture of baking soda and vinegar","Dust and clean light fixtures. Replace burnt-out bulbs","Check for Repairs, Restock Supplies"]},
  Bedroom:{color:C.teal,emoji:"🛏️",items:["Dust ceiling fans, light fixtures, and corners to remove cobwebs","Spot clean any stains or marks. Dust wall hangings, picture frames, and artwork","Clean windows inside and out with glass cleaner","Dust blinds and wash curtains","Wash Bed sheets, pillowcases, mattress cover, and bedspread","Turn mattresses","Clean under beds thoroughly","Vacuum any upholstered furniture, including under cushions","Dust and polish wood furniture with furniture polish","Remove all items from the closet. Sort through clothes and set aside items to donate or discard","Reorganize closet","Organize closets & drawers","Remove items and dust Bookshelves & Cabinets","Wipe down doors and knobs","Dust all decorative items, vases, and knick-knacks. Clean as needed","Clean mirrors with glass cleaner","Vacuum Carpets","Sweep and mop floors. Pay attention to edges and corners","Wash or replace pillows according to care instructions","Remove and clean air vent covers. Dust and vacuum inside the vents if possible","Wash throw pillows and blankets according to care instructions","Shake out small rugs outside and vacuum or steam clean larger rugs","Dust and wipe down all light fixtures and lamps. Replace burnt-out bulbs","Wash curtains or wipe down blinds"]},
  "Living Room":{color:C.coral,emoji:"🛋️",items:["Dust ceiling fans, light fixtures, and corners to remove cobwebs","Spot clean any stains or marks. Dust wall hangings, picture frames, and artwork","Clean windows inside and out with glass cleaner. Wipe down window sills and tracks","Dust blinds and wash curtains","Vacuum sofas and chairs, including under cushions","Vacuum furniture thoroughly","Wipe down chairs & table legs","Dust and polish wood furniture with furniture polish or a suitable wood cleaner","Move furniture to vacuum and clean underneath","Dust all electronics. Use a microfiber cloth and appropriate cleaner for screens","Organize and dust cords and cables","Wipe down remotes and other accessories","Remove items and dust shelves. Reorganize books and decorative items","Wipe Down Cabinet Doors and Knobs","Dust all decorative items, vases, and knick-knacks. Clean as needed","Clean mirrors with glass cleaner","Deep clean Carpet","Wash rugs, wipe down baseboards","Sweep and mop floors","Clean Fireplace and surrounding area","Remove and clean air vent covers. Dust and vacuum inside the vents if possible","Wash throw pillows and blankets according to care instructions","Shake out small rugs outside and vacuum or steam clean larger rugs","Dust and wipe down all light fixtures and lamps. Replace burnt-out bulbs","Wash curtains or wipe down blinds","Declutter old magazines, Newspapers & Mails","Remove Cobwebs"]},
  Laundry:{color:C.blue,emoji:"👕",items:["Remove all items from laundry room and decide what to keep, store or discard","Dust light fixtures and remove cobwebs from corners","Wipe down walls, around light switches and outlets","Clean windows inside and out with glass cleaner. Wipe down window sills & tracks","WASHING MACHINE: Run an empty hot water cycle with washing machine cleaner to clean the drum","Wipe down the exterior and interior door seals with a damp cloth","Clean detergent and fabric softener dispensers","DRYER: Clean the lint trap thoroughly","Clean the vent hose and exhaust duct","Wipe down the exterior with an all-purpose cleaner","Move the washer and dryer to clean the floor underneath and behind them","Vacuum and mop these areas thoroughly","Remove items from shelves and cabinets. Wipe down surfaces","Scrub the sink. Clean the faucet and handles","Clear, wipe down and Disinfect countertops","Sweep or vacuum the floor, corners and under furniture","Empty, clean & Disinfect laundry baskets and hampers","Wipe down detergent bottles and other laundry supplies","Dust and clean light fixtures. Replace burnt-out bulbs","Wipe down Door Handles and Light Switches"]},
  Office:{color:C.orange,emoji:"💻",items:["Remove unnecessary items from your desk and other surfaces","Organize papers and discard or file away as needed","Dust light fixtures and remove cobwebs","Spot clean any stains or marks. Dust wall hangings, picture frames, and artwork","Clean windows inside and out with glass cleaner. Wipe down window sills & tracks","Clean mirrors with glass cleaner, ensuring a streak-free finish","Remove all items from the desk surface. Wipe down desk","Empty drawers, sort and organize contents. Wipe down the inside of drawers before replacing items","Clean Computer and Monitor","Dust and polish wood furniture","Vacuum and clean chair","Clean & Organize Bookshelves and Cabinets","Wipe down doors and knobs","Vacuum and clean Carpet","Sweep and mop floors","Empty all trash cans and recycling bins. Clean & disinfect the interiors and exteriors","Sweep or vacuum the floor to remove hair and debris","Empty the shredder and oil the blades if needed","Remove and clean air vent covers. Dust and vacuum inside the vents if possible","Clean Office rugs, Furniture","Clean Door Handles and Light Switches"]},
  Garage:{color:C.yellow,emoji:"🚗",items:["Remove all items from the garage and sort them into categories: keep, donate, recycle, & trash","Organize items into storage bins or containers","Dust ceiling fixtures, remove cobwebs, and clean light fixtures","Wipe down walls with a damp cloth, especially if there are any oil stains or marks","Clean windows inside and out with glass cleaner. Wipe down window sills & tracks","Sweep the floor thoroughly to remove dust, dirt, and debris","Vacuum & clean up finer dirt and dust from the floor and corners","Apply a degreaser to any oil stains or spills. Scrub with a stiff brush and rinse with water","Empty and clean Shelves and Cabinets","Replace items in an organized manner. Use storage bins","Clear off the workbench and wipe it down with an all-purpose cleaner","Clean tools with a damp cloth and organize them","Clean and maintain lawn equipment such as mowers, trimmers, and leaf blowers","Wipe down bikes and other sports equipment. Organize them using racks or hooks","Empty and clean trash cans and recycling bins. Disinfect the interiors and exteriors","Dust and clean air vents","Wipe down the door and handles","Label storage bins and shelves to keep everything organized"]},
  Entryway:{color:C.teal,emoji:"🚪",items:["Declutter Entryway items and sort what to keep, store, or discard","Wipe down walls, around light switches and door frames with a damp cloth to remove any dirt or marks","Clean windows inside and out with glass cleaner. Wipe down window sills and tracks","Clean mirrors with glass cleaner, ensuring a streak-free finish","Wipe down the front door with an all-purpose cleaner. Clean the doorknob or handle & the area around it","Sweep or vacuum the floor, corners and under furniture","Mop the Floor","Shake out or vacuum floor mats and rugs","Empty out shoe racks and storage units. Wipe them down with an all-purpose cleaner","Wipe down benches or seating areas. Clean any cushions or upholstery as needed","Dust all decorative items, vases, and knick-knacks","Dust and clean picture frames and artwork","Remove and clean air vent covers. Dust and vacuum inside the vents if possible","Dust and clean light fixtures. Replace burnt-out bulbs","Empty and clean the umbrella stand"]},
  Storage:{color:C.coral,emoji:"📦",items:["Remove all items from Storage area and sort into keep, donate, recycle, and trash","Purge & organize holiday decor","Get rid of items no longer needed","Organize items into storage bins or containers for easier reorganization","Dust light fixtures and remove cobwebs from corners","Wipe down walls, corners, areas around light switches and outlets","Clean windows inside and out with glass cleaner. Wipe down window sills & tracks","Wipe down Shelves & cabinets surfaces","Replace items in an organized manner","Sweep or vacuum the floor, corners and under shelving units","Wipe down glass doors with glass cleaner or a vinegar solution","Mop the floor","Wipe down Storage Bins and Containers","Dust and clean any furniture stored in the area","Clean and maintain any large equipment or tools stored","Remove and clean air vent covers","Dust and clean light fixtures. Replace burnt-out bulbs","Wipe down Door Handles and Light Switches","Clean Door","Check for Repairs, Restock Supplies"]},
};

const DECLUTTER_DATA={
  Office:{color:C.orange,emoji:"🗂️",items:["Shred documents","Old Keys","Dried out Pens & Markers","Old Cords / Adapters","Clean out Drawers","Recycle paper / junk mail","Old Business Cards"]},
  Kitchen:{color:C.yellow,emoji:"🍳",items:["Tupperware without lids","Cracked Plates","Chipped Glasses","Mismatched Sets","Expired Goods","Unused Appliances","Scratched pots & pans"]},
  Bedrooms:{color:C.teal,emoji:"🛏️",items:["Outgrown Clothes","Outdated Shoes","Torn Clothing","Old Hats","Shoe Boxes","Old Blankets","Remove & store out-of-season clothing"]},
  Bathrooms:{color:C.coral,emoji:"🚿",items:["Old Bath Toys","Empty Bottles","Old Brushes","Trash","Ripped / Stained Towels","Expired Medicine","Old Hair Ties"]},
  Garage:{color:C.blue,emoji:"🚗",items:["Broken Equipment","Dirty / Ripped Pages","Expired Chemicals","Dried Out Paint Cans","Unneeded Paint Cans","Unwanted Holiday Decor","Broken Tools","Empty Boxes","Old Items"]},
  Playroom:{color:C.orange,emoji:"🧸",items:["Outgrown Toys","Incomplete Games","Toys without a Match","Outgrown Furniture","Broken Electronics","Outgrown Costumes","Unused craft supplies"]},
};

const SEASONAL_DATA={
  Spring:{color:C.coral,emoji:"🌸",items:["Deep clean carpets and rugs","Clean and organize kitchen cabinets and pantry","Wash bedding, pillows, and curtains","Clean baseboards, doors, and trim","Stainless steel cleaner for appliances","Check and replace HVAC filters","Clean refrigerator coils","Clean kitchen appliances (oven, microwave, dishwasher)","Rake & remove leaves & debris from lawn & garden beds","Prune trees and shrubs","Inspect and repair outdoor fences and gates","Prepare and clean outdoor furniture for use","Test and replace batteries in smoke detectors and carbon monoxide detectors","Service air conditioning units","Check and repair caulking around windows and doors","Declutter and donate items no longer needed","Inspect roof for damage or missing shingles"]},
  Summer:{color:C.yellow,emoji:"☀️",items:["Clean ceiling fans and light fixtures","Vacuum and clean upholstery and curtains","Deep clean windows and window sills","Declutter and organize closets, cabinets & storage areas","Clean air conditioning units and ceiling fan","Power wash exterior siding, decks, and patios","Clean and inspect outdoor furniture","Inspect and clean outdoor grill or cooking area","Clean and organize the garage or shed","Service or clean air conditioning units and ceiling fans","Check and repair outdoor lighting fixtures","Service or clean kitchen appliances","Maintain your pool","Test and replace batteries in smoke and carbon monoxide detectors","Schedule A/C Maintenance"]},
  "Fall / Autumn":{color:C.teal,emoji:"🍂",items:["Deep clean windows and window treatments","Clean and inspect fireplace and chimney","Clean and organize closets for seasonal clothing","Clean ceiling fans and HVAC vents","Remove debris from roof and inspect for damage","Clean gutters and downspouts","Drain and store garden hoses","Clean and store outdoor furniture and cushions","Inspect exterior of the house for cracks or gaps","Clean and store gardening tools","Schedule heating system maintenance","Test and replace batteries in smoke detectors and carbon monoxide detectors","Prepare humidifiers for use","Winterize outdoor faucets and irrigation systems","Cover & Seal A/C Units","Change window treatments","Prepare Winter tools, clothes & products"]},
  Winter:{color:C.blue,emoji:"❄️",items:["Deep clean carpets and rugs","Clean and sanitize kitchen and bathroom surfaces","Clean and polish wood floors","Clean and organize pantry and kitchen cabinets","Purge and declutter before the holidays","Keep walkways and driveways clear of snow & ice","Check outdoor lighting & replace bulbs as needed","Inspect and clean exterior vents","Clean and maintain snow removal equipment","Check and repair roof for any winter damage","Inspect trees for damage due to snow & ice accumulation","Seal off any opening","Maintain your Hot water cylinder","Protect your pipes","Check your roof","Waterproof your door & windows"]},
};

const YEARLY_DATA={
  January:{color:C.orange,emoji:"🗓️",items:["Deep clean kitchen appliances","Declutter and organize closets","Clean windows and blinds","Dust light fixtures & ceiling fans","Replace air filters","Vacuum upholstery and rugs","Wash windows inside & out","Clean kitchen cabinets & appliances","Check plumbing for leaks","Dust and polish woodwork","Clean outdoor furniture","Sweep, Clean, Mop Floors"]},
  February:{color:C.yellow,emoji:"🗓️",items:["Scrub bathroom tiles & fixtures","Launder bedding and linens","Dust and polish furniture","Clean baseboards and trim","Organize garage or store areas","Sweep, Clean, Mop Floors","Organize and clean closets","Dust and polish wood furniture","Clean ceiling fans & light fixtures","Clean oven & range hood","Sweep, Clean, Mop Floors"]},
  March:{color:C.teal,emoji:"🗓️",items:["Dust curtains & clean air vents","Wipe down electronics","Sweep outdoor areas & trim bushes","Deep clean carpets or rugs","Declutter and organize pantry","Sweep, Clean, Mop Floors"]},
  April:{color:C.coral,emoji:"🗓️",items:["Wash windows inside & out","Clean kitchen cabinets & appliances","Check plumbing for leaks","Dust and polish woodwork","Clean outdoor furniture","Dust light fixtures & ceiling fans","Replace air filters","Vacuum upholstery and rugs"]},
  May:{color:C.blue,emoji:"🗓️",items:["Organize and clean closets","Sweep, Clean, Mop Floors","Organize garage or store areas","Clean baseboards and trim","Scrub grill, outdoor equipment","Deep clean refrigerator","Spot clean walls touchup paint","Vacuum upholstered furniture"]},
  June:{color:C.orange,emoji:"🗓️",items:["Sweep, Clean, Mop Floors","Declutter and organize pantry","Deep clean carpets or rugs","Sweep outdoor areas & trim bushes","Scrub grill, outdoor equipment"]},
  July:{color:C.yellow,emoji:"🗓️",items:["Declutter tools & storage items","Vacuum and rotate mattresses","Scrub and seal tile grout in bathrooms and kitchens","Scrub grill grates and replace propane if needed","Clean outside windows & screens","Sweep and apply deck treatment as necessary","Sweep, Clean, Mop Floors","Clean outdoor furniture"]},
  August:{color:C.teal,emoji:"🗓️",items:["Scrub showers, toilets & sinks","Organize & dust books / shelves","Treat leather sofas and chairs","Remove dust and debris from vents","Organize files & shred unnecessary documents","Wipe down frequently touched surfaces"]},
  September:{color:C.coral,emoji:"🗓️",items:["Clean fireplace and chimney","Dust and Clean Blinds","Clean Washing Machine","Remove cobwebs & dust from high corners","Arrange tools and equipment for easy access","Sweep porch and clean door & doormat"]},
  October:{color:C.blue,emoji:"🗓️",items:["Clean & Organize Kitchen Pantry","Dust and Clean Electronics","Shine refrigerator & dishwasher","Clean Light Fixtures","Clean Gutters and Downspouts","Dust and Clean Ceiling Fans","Deep Clean Oven","Vacuum-Clean Rugs and Carpets"]},
  November:{color:C.orange,emoji:"🗓️",items:["Clean Gutters and Downspouts","Dust and Clean Ceiling Fans","Deep Clean Oven","Vacuum-Clean Rugs and Carpets"]},
  December:{color:C.yellow,emoji:"🗓️",items:["Holiday Cleaning","Wipe down holiday lights","Prepare fireplace for holiday use","Clean & refresh entryway mats"]},
};

const SPEED_CLEAN_TIME_DATA={
  "5 Minutes":{color:C.orange,emoji:"⚡",items:["Pick up & put away items","Wipe Kitchen counters","Load/unload dishwasher","Make Bed","Wipe down Bathroom surfaces/toilet seat"]},
  "10–15 Minutes":{color:C.yellow,emoji:"⏱️",items:["Quickly rinse & load any dirty dishes into the dishwasher","Spot-clean the floor around high-traffic areas","Scrub and sanitize the toilet quickly","Clean sink and wipe down bathroom countertops","Make the bed and straighten up pillows","Quickly tidy up any clothes or items lying around","Dust furniture surfaces including coffee tables & shelves","Quickly vacuum or sweep high-traffic areas"]},
  "20 Minutes":{color:C.teal,emoji:"🕐",items:["Quickly wipe down kitchen countertops & appliances","Spot-clean the floor","Do dishes","Clean bathroom sink, toilet, & mirror quickly","Wipe down bathroom surfaces & fixtures","Make the bed","Dust visible areas and quick tidy-up","Dust Living room surfaces & electronics","Declutter as needed"]},
  "30 Minutes":{color:C.coral,emoji:"🕧",items:["Quickly wipe down kitchen countertops & appliances","Sweep or spot-clean Kitchen floor","Do Dishes","Wipe down bathroom surfaces & fixtures","Make the bed and straighten surfaces","Dust furniture & vacuum/sweep the floor","Dust living room furniture and electronics","Clean all tables"]},
  "45 Minutes":{color:C.blue,emoji:"🕒",items:["Clean Kitchen appliances","Do dishes","Wipe down kitchen cabinets & surfaces","Scrub Toilet & Clean Shower/tub","Make the bed","Change bedlinens & Dust surfaces","Dust living room furniture","Vacuum Living room"]},
  "60 Minutes":{color:C.orange,emoji:"🕕",items:["Wipe Kitchen surfaces & clean appliances","Sweep or vacuum the floor","Do dishes","Clean sink, toilet, and bathtub/shower","Make the bed and tidy up surfaces","Dust furniture","Vacuum/sweep living room floor","Arrange Seating","Empty trash bins throughout the house","Straighten up pillows and throws","Replace towels if needed","Make the Bed"]},
  "90 Minutes":{color:C.yellow,emoji:"🕘",items:["Clean kitchen countertops, sink, & appliances","Wipe down Kitchen cabinet fronts","Sweep and mop Kitchen floor","Do dishes","Clean bathroom sink, countertop, and mirror","Scrub toilet and bathtub/shower","Replace towels if needed","Vacuum or sweep Bedroom floor","Dust Living room furniture & electronics","Vacuum or sweep Living room floor","Straighten up pillows and throws","Do a laundry load"]},
};

const SPEED_CLEAN_ROOM_DATA={
  "Gather Supplies":{color:C.orange,emoji:"🧴",items:["All-purpose cleaner or multi-surface cleaner","Disinfectant spray or wipes","Glass cleaner","Microfiber cleaning cloths or paper towels","Broom, vacuum cleaner, dust pan","Mop & bucket, scrubbing sponge","Trash bags, toilet bowl cleaner and brush"]},
  Kitchen:{color:C.yellow,emoji:"🍳",items:["Pick up & put away items that don't belong","Load dishwasher","Put dirty dishes in sink","Manually wash dishes as needed","Disinfect and wipe all counters","Wipe Exteriors of all Appliances (fridge, microwave)","Wipe down Stove tops","Clean sink","Sweep floor","Empty trash","Spot-clean cabinet doors","Spot clean all walls","Take out trash & Recycling","Clear Dining room table"]},
  "Dining Room":{color:C.teal,emoji:"🪑",items:["Clear table","Dust surfaces","Sweep or vacuum floor","Straighten chairs","Spot-clean windows","Arrange centerpieces"]},
  Bathroom:{color:C.coral,emoji:"🚿",items:["Pick up clutter","Wipe countertop","Clean Mirrors","Wipe sink and faucet","Clean toilet seat and rim","Clean & Disinfect toilet Bowl","Wipe down toilet bowl & surrounding surface","Change towels","Empty Trash can","Sweep Floor","Replace toilet paper","Spot clean Floor stains"]},
  Bedrooms:{color:C.blue,emoji:"🛏️",items:["Pick up & put away items","Make the Bed","Open curtains","Pick up clothes","Wipe bedside table","Dust all surfaces","Vacuum floor","Wipe mirrors","Clear clutter from dresser/night stand"]},
  "Living Room":{color:C.orange,emoji:"🛋️",items:["Pick up & put away items/trash","Fluff pillows","Fold blankets","Straighten magazines","Wipe coffee table","Dust TV and surfaces","Wipe remote controls","Dust all surfaces","Clean & Organize desk area","Wipe down furniture, table & chair","Shake out rugs","Vacuum Floor"]},
  Entryway:{color:C.yellow,emoji:"🚪",items:["Tidy shoes and coats","Sweep or vacuum floor","Clean doormat","Wipe door handles","Wipe light switches"]},
  Everywhere:{color:C.teal,emoji:"🏠",items:["Pick up clutter","Vacuum carpet, Rugs & other areas","Quickly mop floors","Sweep floor","Clean Mirror & glass surfaces","Quickly empty all trash bins","Wipe all tables & Furniture"]},
};

function initShoppingList(){
  const ex=LS.get("shoppingList",null);
  if(ex)return ex;
  const def={stores:[
    {id:"s1",name:"Grocery Store",color:C.teal,categories:[
      {id:"c1",name:"Produce",items:[]},{id:"c2",name:"Dairy & Eggs",items:[]},
      {id:"c3",name:"Meat & Fish",items:[]},{id:"c4",name:"Pantry",items:[]},
      {id:"c5",name:"Frozen",items:[]},{id:"c6",name:"Household",items:[]}
    ]},
    {id:"s2",name:"Costco",color:C.blue,categories:[
      {id:"c7",name:"Produce",items:[]},{id:"c8",name:"Meat",items:[]},
      {id:"c9",name:"Pantry & Bulk",items:[]},{id:"c10",name:"Household",items:[]},
      {id:"c11",name:"Clothing",items:[]},{id:"c12",name:"Electronics",items:[]}
    ]},
    {id:"s3",name:"Pharmacy",color:C.coral,categories:[
      {id:"c13",name:"Medications",items:[]},{id:"c14",name:"Personal Care",items:[]},
      {id:"c15",name:"Vitamins",items:[]}
    ]}
  ]};
  LS.set("shoppingList",def);return def;
}
function initTodoList(){
  const ex=LS.get("todoList",null);
  if(ex)return ex;
  LS.set("todoList",[]);return[];
}
function initTasks(){const ex=LS.get("tasks",null);if(ex)return ex;const d=[{id:1,taskName:"Make dinner",category:"Daily",day:"Today",minutes:30,completed:false,notes:"",room:"Kitchen"},{id:2,taskName:"Kitchen counters",category:"Daily",day:"Today",minutes:10,completed:false,notes:"",room:"Kitchen"},{id:3,taskName:"Vacuum upstairs",category:"Daily",day:"Today",minutes:20,completed:false,notes:"",room:"Upstairs"},{id:4,taskName:"Pick up toys",category:"Daily",day:"Today",minutes:5,completed:false,notes:"",room:"Living Room"},{id:5,taskName:"Declutter counter",category:"Daily",day:"Today",minutes:15,completed:false,notes:"",room:"Kitchen"}];LS.set("tasks",d);return d;}
function initTimeChores(){const ex=LS.get("timeChores",null);if(ex)return ex;const d=[{id:1,choreName:"Wipe down stovetop",minutes:5,completed:false},{id:2,choreName:"Take out recycling",minutes:5,completed:false},{id:3,choreName:"Tidy living room",minutes:10,completed:false},{id:4,choreName:"Clean bathroom sink",minutes:10,completed:false},{id:5,choreName:"Sweep kitchen floor",minutes:10,completed:false},{id:6,choreName:"Wipe kitchen counters",minutes:10,completed:false},{id:7,choreName:"Clean toilet",minutes:15,completed:false},{id:8,choreName:"Mop kitchen floor",minutes:20,completed:false}];LS.set("timeChores",d);return d;}
function initRandomChores(){const ex=LS.get("randomChores",null);if(ex)return ex;const d=[{id:1,choreName:"Clean baseboards",minutes:15},{id:2,choreName:"Dust vents",minutes:10},{id:3,choreName:"Organize junk drawer",minutes:20},{id:4,choreName:"Wipe light switches",minutes:5},{id:5,choreName:"Clean out freezer",minutes:30},{id:6,choreName:"Wash windows",minutes:30},{id:7,choreName:"Vacuum under furniture",minutes:20}];LS.set("randomChores",d);return d;}
function initCompletedChores(){const ex=LS.get("completedChores",null);if(ex)return ex;LS.set("completedChores",[]);return[];}

const DiceSvg=({size=22,color="#9CA3AF"})=>(<svg width={size} height={size} viewBox="0 0 40 40" fill="none"><polygon points="20,2 36,11 20,20 4,11" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/><polygon points="4,11 20,20 20,38 4,29" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/><polygon points="20,20 36,11 36,29 20,38" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/><circle cx="20" cy="11" r="1.8" fill={color}/><circle cx="8" cy="18.5" r="1.5" fill={color}/><circle cx="12" cy="24.5" r="1.5" fill={color}/><circle cx="16" cy="30.5" r="1.5" fill={color}/><circle cx="30" cy="21.5" r="1.5" fill={color}/><circle cx="26" cy="27.5" r="1.5" fill={color}/></svg>);

const Ic={
  home:(c="#9CA3AF")=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  tasks:(c="#9CA3AF")=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  random:(c="#9CA3AF")=><DiceSvg size={22} color={c}/>,
  progress:(c="#9CA3AF")=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  more:(c="#9CA3AF")=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>,
  check:(c=C.white)=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clock:(c=C.greyText)=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  plus:(c=C.white)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  back:(c=C.dark)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  trash:(c=C.coral)=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  refresh:(c=C.teal)=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  edit:(c=C.blue)=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  arrows:(c=C.greyText)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

function Stepper({value,onChange,accent}){return(<div style={{display:"flex",alignItems:"center",gap:32}}><button type="button" onClick={()=>onChange(Math.max(1,value-5))} style={{width:50,height:50,borderRadius:"50%",border:`2.5px solid ${accent}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg></button><span style={{fontSize:36,fontWeight:800,color:C.dark,minWidth:60,textAlign:"center"}}>{value}</span><button type="button" onClick={()=>onChange(value+5)} style={{width:50,height:50,borderRadius:"50%",border:`2.5px solid ${accent}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div>);}
function LargeStepper({value,onChange,accent}){return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:24}}><button type="button" onClick={()=>onChange(Math.max(5,value-5))} style={{width:54,height:54,borderRadius:"50%",border:`3px solid ${accent}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg></button><div><div style={{fontSize:52,fontWeight:900,color:accent,lineHeight:1}}>{value}</div><div style={{fontSize:14,color:C.greyText,textAlign:"center"}}>minutes</div></div><button type="button" onClick={()=>onChange(value+5)} style={{width:54,height:54,borderRadius:"50%",border:`3px solid ${accent}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div>);}
function ProgressBar({pct,done,total,minsDone,accent,accentEnd,pctColor,clockColor}){const nc=pctColor||accent;const cc=clockColor||nc;return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}><div><span style={{fontSize:32,fontWeight:900,color:nc}}>{pct}%</span><span style={{fontSize:14,color:C.greyText,marginLeft:6}}>complete</span></div><div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:700,color:C.dark}}>{done} / {total} tasks</div></div></div><div style={{height:16,background:C.grey,borderRadius:8,overflow:"hidden",marginBottom:10}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${accent},${accentEnd})`,borderRadius:8,transition:"width 0.5s"}}/></div><div style={{display:"flex",alignItems:"center",gap:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span style={{fontSize:14,fontWeight:700,color:cc}}>{minsDone} min</span><span style={{fontSize:13,color:C.greyText}}>completed today</span></div></div>);}
function Header({title,color=C.orange,onBack,rightEl,fs=30}){return(<div style={{display:"flex",alignItems:"center",padding:"16px 20px 8px",gap:8}}>{onBack&&<button onClick={onBack} style={{border:"none",background:"none",cursor:"pointer",padding:4,marginLeft:-4,flexShrink:0}}>{Ic.back()}</button>}<h2 style={{flex:1,margin:0,fontSize:fs,fontWeight:900,letterSpacing:1,color,textAlign:"center",textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{title}</h2>{rightEl&&<div style={{flexShrink:0}}>{rightEl}</div>}{onBack&&<div style={{width:30,flexShrink:0}}/>}</div>);}
function Dots(){return(<div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:16}}>{DC.map((c,i)=><div key={i} style={{width:12,height:12,borderRadius:"50%",background:c}}/>)}</div>);}
let _cbxCount=0;
function CBx({checked,onToggle,color}){const[colorIdx]=useState(()=>_cbxCount++%DC.length);const col=color||(DC[colorIdx]);return(<div onClick={onToggle} style={{width:22,height:22,borderRadius:6,flexShrink:0,cursor:"pointer",border:`2px solid ${checked?col:C.border}`,background:checked?col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>{checked&&Ic.check()}</div>);}
function MonthDayPicker({value,onChange,accent}){return(<div><div style={{fontSize:12,color:C.greyText,marginBottom:10}}>Tap a number to select</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{Array.from({length:31},(_,i)=>i+1).map(d=>{const val=`Day ${d}`,active=value===val;return(<button type="button" key={d} onClick={()=>onChange(val)} style={{width:40,height:40,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,background:active?accent:C.white,color:active?C.white:C.dark,boxShadow:active?"none":"0 1px 3px rgba(0,0,0,0.1)"}}>{d}</button>);})}<button type="button" onClick={()=>onChange("Last day")} style={{padding:"0 14px",height:40,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:value==="Last day"?accent:C.white,color:value==="Last day"?C.white:C.dark,boxShadow:value==="Last day"?"none":"0 1px 3px rgba(0,0,0,0.1)"}}>Last</button></div>{value&&value.startsWith("Day ")&&<div style={{marginTop:10,fontSize:13,color:accent,fontWeight:600}}>📅 Repeats on the {ordinal(parseInt(value.replace("Day ","")))} of each month</div>}{value==="Last day"&&<div style={{marginTop:10,fontSize:13,color:accent,fontWeight:600}}>📅 Repeats on the last day of each month</div>}</div>);}

function ChecklistScreen({title,color,data,storageKey,onBack}){
  const[state,setState]=useState(()=>initChecklist(storageKey,data));
  const[expanded,setExpanded]=useState(null);
  const[editMode,setEditMode]=useState(false);
  const[newItemText,setNewItemText]=useState({});

  const save=(ns)=>{setState(ns);LS.set(storageKey,ns);};

  const[popKey,setPopKey]=useState(null);
  const toggle=(section,idx)=>{
    const key=section+"-"+idx;
    setPopKey(key);
    setTimeout(()=>setPopKey(null),280);
    const ns={...state};
    ns[section]={...ns[section],checked:[...ns[section].checked]};
    ns[section].checked[idx]=!ns[section].checked[idx];
    save(ns);
  };

  const deleteItem=(section,idx)=>{
    const ns={...state};
    const items=[...ns[section].items];
    const checked=[...ns[section].checked];
    items.splice(idx,1);checked.splice(idx,1);
    ns[section]={...ns[section],items,checked};
    save(ns);
  };

  const addItem=(section)=>{
    const text=(newItemText[section]||"").trim();
    if(!text)return;
    const ns={...state};
    ns[section]={...ns[section],items:[...ns[section].items,text],checked:[...ns[section].checked,false]};
    save(ns);
    setNewItemText(prev=>({...prev,[section]:""}));
  };

  const resetAll=()=>{
    const ns={};
    Object.keys(state).forEach(s=>{ns[s]={...state[s],checked:state[s].checked.map(()=>false)};});
    save(ns);
  };

  const sections=Object.keys(state);
  const totalItems=sections.reduce((a,s)=>a+(state[s].items||[]).length,0);
  const doneItems=sections.reduce((a,s)=>a+(state[s].checked||[]).filter(Boolean).length,0);
  const pct=totalItems?Math.round((doneItems/totalItems)*100):0;

  return(
    <div style={{paddingBottom:80}}>
      {celebrationTask&&<CelebrationModal task={celebrationTask} onDone={()=>setCelebrationTask(null)}/>}
      <Header title={title} color={color} onBack={onBack} fs={24}/>
      <Dots/>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{background:C.white,borderRadius:20,padding:"16px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,fontWeight:700,color}}>Overall Progress</span><span style={{fontSize:13,fontWeight:700,color:C.dark}}>{doneItems}/{totalItems}</span></div>
          <div style={{height:10,background:C.grey,borderRadius:6,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:6,transition:"width 0.4s"}}/></div>
        </div>
        {sections.map(section=>{
          const sec=data[section]||{emoji:"📋",color};
          const sItems=state[section].items||[];
          const checks=state[section].checked||[];
          const secDone=checks.filter(Boolean).length;
          const isOpen=expanded===section;
          return(
            <div key={section} style={{background:C.white,borderRadius:20,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
              <button type="button" onClick={()=>setExpanded(isOpen?null:section)} style={{width:"100%",background:`${sec.color||color}18`,border:"none",cursor:"pointer",fontFamily:"inherit",padding:"14px 18px",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                <span style={{fontSize:22,flexShrink:0}}>{sec.emoji||"📋"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:800,color:C.dark}}>{section}</div>
                  <div style={{fontSize:12,color:C.greyText,marginTop:2}}>{secDone} of {sItems.length} done</div>
                </div>
                <div style={{minWidth:52,height:30,borderRadius:20,background:`${sec.color||color}35`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:"0 8px"}}>
                  <span style={{fontSize:12,fontWeight:800,color:sec.color||color}}>{sItems.length?Math.round((secDone/sItems.length)*100):0}%</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.greyText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {isOpen&&(
                <div style={{borderTop:`1px solid ${C.border}`}}>
                  {sItems.map((item,idx)=>(
                    <div key={idx} onClick={()=>!editMode&&toggle(section,idx)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",borderBottom:idx<sItems.length-1||editMode?`1px solid ${C.border}`:"none",cursor:editMode?"default":"pointer",opacity:checks[idx]&&!editMode?0.6:1,transition:"transform 0.14s ease-out, box-shadow 0.14s ease-out",transform:popKey===(section+"-"+idx)?"scale(1.03)":"scale(1)",boxShadow:popKey===(section+"-"+idx)?"0 6px 20px rgba(0,0,0,0.11)":"none",borderRadius:8,position:"relative",zIndex:popKey===(section+"-"+idx)?2:0}}>
                      {editMode?(
                        <button type="button" onClick={()=>deleteItem(section,idx)} style={{border:"none",background:"none",cursor:"pointer",padding:2,flexShrink:0}}>{Ic.trash()}</button>
                      ):(
                        <CBx checked={checks[idx]||false} onToggle={()=>toggle(section,idx)} color={sec.color||color}/>
                      )}
                      <span style={{fontSize:13,fontWeight:500,color:C.dark,textDecoration:checks[idx]&&!editMode?"line-through":"none",lineHeight:1.4,flex:1}}>{item}</span>
                    </div>
                  ))}
                  {editMode&&(
                    <div style={{display:"flex",gap:8,padding:"10px 14px",background:"#FAFAFA"}}>
                      <input
                        style={{flex:1,padding:"8px 12px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,fontFamily:"inherit",color:C.dark,background:C.white,outline:"none"}}
                        placeholder="Add new item..."
                        value={newItemText[section]||""}
                        onChange={e=>setNewItemText(prev=>({...prev,[section]:e.target.value}))}
                        onKeyDown={e=>e.key==="Enter"&&addItem(section)}
                      />
                      <button type="button" onClick={()=>addItem(section)} style={{background:color,border:"none",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:C.white}}>Add</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <button type="button" onClick={resetAll} style={{background:color,border:"none",borderRadius:16,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><div style={{width:28,height:28,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Ic.refresh(color)}</div><span style={{fontSize:16,fontWeight:700,color:C.white}}>Reset All</span></button>
        <button type="button" onClick={()=>setEditMode(!editMode)} style={{background:C.grey,color:C.dark,border:"none",borderRadius:16,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{fontSize:22}}>{editMode?"✅":"⚙️"}</span><span>{editMode?"Done Managing":"Manage Checklist"}</span></button>
      </div>
    </div>
  );
}

function TaskForm({initial,onSave,onDelete,accent,saveLabel}){
  const[name,setName]=useState(initial.taskName||"");
  const[category,setCategory]=useState(initial.category||"Daily");
  const[monthDay,setMonthDay]=useState(initial.category==="Monthly"?(initial.day||""):"");
  const[minutes,setMinutes]=useState(initial.minutes||15);
  const[notes,setNotes]=useState(initial.notes||"");
  const[room,setRoom]=useState(initial.room||"General");
  const[saved,setSaved]=useState(false);const[err,setErr]=useState("");
  const[selectedMonths,setSelectedMonths]=useState(()=>{if(initial.months&&initial.months!=="every")return[initial.months];return["every"];});
  const[selectedDays,setSelectedDays]=useState(()=>{if(initial.category==="Weekly"&&initial.day&&initial.day!=="Today")return[initial.day];return[];});
  const inp={width:"100%",padding:"13px 16px",border:`1px solid ${C.border}`,borderRadius:12,fontSize:14,fontFamily:"inherit",color:C.dark,background:C.white,boxSizing:"border-box",outline:"none"};
  const handleCat=c=>{setCategory(c);if(c!=="Monthly"){setMonthDay("");setSelectedMonths(["every"]);}if(c!=="Weekly")setSelectedDays([]);};
  const toggleMonth=m=>{if(m==="every"){setSelectedMonths(["every"]);return;}setSelectedMonths(prev=>{const without=prev.filter(x=>x!=="every");if(without.includes(m))return without.filter(x=>x!==m).length?without.filter(x=>x!==m):["every"];return[...without,m];});};
  const toggleDay=d=>{setSelectedDays(prev=>prev.includes(d)?prev.filter(x=>x!==d).length?prev.filter(x=>x!==d):[]:([...prev,d]));};
  const handleSave=()=>{const t=(name||"").trim();if(!t){setErr("Please enter a task name.");return;}setErr("");setSaved(true);onSave({taskName:t,category,day:category==="Monthly"?(monthDay||"Day 1"):category==="Weekly"?(selectedDays[0]||"Monday"):"Today",minutes,notes:(notes||"").trim(),room,months:category==="Monthly"?selectedMonths:undefined,days:category==="Weekly"&&selectedDays.length>1?selectedDays:undefined});};
  return(<div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:16}}><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:6}}>Task Name</label><input style={{...inp,border:`1px solid ${err?C.coral:C.border}`}} placeholder="e.g., Clean bathroom sink" value={name} onChange={e=>{setName(e.target.value);if(err)setErr("");}}/>{err&&<div style={{fontSize:12,color:C.coral,marginTop:4}}>{err}</div>}</div><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:8}}>Room / Area</label><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{ROOMS.map(r=>{const active=room===r,col=RC[r]||C.greyText;return(<button type="button" key={r} onClick={()=>setRoom(r)} style={{padding:"10px 6px",borderRadius:20,border:`2px solid ${active?col:C.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:active?col:C.white,color:active?C.white:C.dark,textAlign:"center"}}>{r}</button>);})}</div></div><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:8}}>Category</label><div style={{display:"flex",gap:8}}>{["Daily","Weekly","Monthly"].map(c=>(<button type="button" key={c} onClick={()=>handleCat(c)} style={{flex:1,padding:"10px 6px",borderRadius:20,border:`2px solid ${category===c?accent:C.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:category===c?accent:C.white,color:category===c?C.white:C.dark,textAlign:"center"}}>{c}</button>))}</div></div>{category==="Monthly"?(<div style={{background:C.grey,borderRadius:16,padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:10}}>📅 Day of Month</label><MonthDayPicker value={monthDay} onChange={setMonthDay} accent={accent}/></div><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:8}}>🗓️ Which Month(s)?</label><div style={{marginBottom:8}}><button type="button" onClick={()=>toggleMonth("every")} style={{padding:"8px 14px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:selectedMonths.includes("every")?accent:C.white,color:selectedMonths.includes("every")?C.white:C.dark}}>Every Month</button></div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{MONTHS_SHORT.map((m,i)=>{const full=MONTHS_FULL[i];const active=selectedMonths.includes(full);return(<button type="button" key={m} onClick={()=>toggleMonth(full)} style={{padding:"8px 10px",borderRadius:20,border:`2px solid ${active?accent:C.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:active?accent:C.white,color:active?C.white:C.dark,minWidth:48}}>{m}</button>);})}</div>{!selectedMonths.includes("every")&&<div style={{marginTop:8,fontSize:12,color:accent,fontWeight:600}}>Selected: {selectedMonths.join(", ")}</div>}</div></div>):(<div>
    {category==="Weekly"&&(<div style={{background:C.grey,borderRadius:16,padding:"14px 16px",marginBottom:0}}><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:10}}>📅 Which Day(s)?</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{WEEKDAYS.map((day,i)=>{const active=selectedDays.includes(day);return(<button type="button" key={day} onClick={()=>toggleDay(day)} style={{padding:"10px 12px",borderRadius:20,border:`2px solid ${active?accent:C.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:active?accent:C.white,color:active?C.white:C.dark}}>{DAYS_SHORT[i]}</button>);})}</div>{selectedDays.length>0&&<div style={{marginTop:8,fontSize:12,color:accent,fontWeight:600}}>Selected: {selectedDays.join(", ")}</div>}{selectedDays.length===0&&<div style={{marginTop:8,fontSize:12,color:C.greyText}}>Tap days — task appears on those days each week</div>}</div>)}
    {category==="Daily"&&(<div style={{background:"#E8F7F2",borderRadius:14,padding:"12px 16px",display:"flex",gap:10}}><span style={{fontSize:18}}>💡</span><div style={{fontSize:13,color:C.dark}}>Appears on the home screen every day and resets each morning.</div></div>)}
  </div>)}<div style={{textAlign:"center"}}><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:8}}>Time (minutes)</label><div style={{display:"flex",justifyContent:"center"}}><Stepper value={minutes} onChange={setMinutes} accent={accent}/></div></div><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:6}}>Notes (optional)</label><textarea style={{...inp,height:80,resize:"none"}} placeholder="Any additional notes..." value={notes} onChange={e=>setNotes(e.target.value)}/></div><button type="button" onClick={handleSave} disabled={saved} style={{background:saved?C.teal:accent,color:C.white,border:"none",borderRadius:16,padding:"16px",fontSize:18,fontWeight:700,cursor:saved?"default":"pointer",fontFamily:"inherit"}}>{saved?"✓ Saved!":saveLabel}</button>{onDelete&&(<button type="button" onClick={onDelete} style={{background:C.white,color:C.coral,border:`2px solid ${C.coral}`,borderRadius:16,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}>{Ic.trash()}<span>Delete Task</span></button>)}</div>);
}

function BottomNav({tab,setTab}){
  const tabs=[{id:"home",label:"Home",icon:Ic.home,activeColor:C.teal},{id:"tasks",label:"Tasks",icon:Ic.tasks,activeColor:C.coral},{id:"random",label:"Random",icon:Ic.random,activeColor:C.orange},{id:"progress",label:"Progress",icon:Ic.progress,activeColor:C.teal},{id:"more",label:"Explore",icon:Ic.more,activeColor:C.blue}];
  return(<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.white,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100}}>{tabs.map(t=>{const active=tab===t.id,color=active?t.activeColor:C.greyText;return(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,border:"none",background:"none",padding:"8px 0 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>{t.icon(color)}<span style={{fontSize:10,color,fontWeight:active?700:400,fontFamily:"inherit"}}>{t.label}</span></button>);})}</div>);
}

function TaskRow({task,onToggle,onEdit,showDay,isLast}){const col=RC[task.room]||C.greyText;
  const[popping,setPopping]=useState(false);
  const handleToggle=()=>{setPopping(true);setTimeout(()=>setPopping(false),280);onToggle();};

  const dayLabel=task.category==="Weekly"&&task.day?DAYS_SHORT[WEEKDAYS.indexOf(task.day)]:null;
  const dateLabel=task.category==="Monthly"&&task.day?(task.day==="Last day"?"Last":task.day.replace("Day ","")):null;
  return(<div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:isLast?"":`1px solid ${C.border}`,opacity:task.completed?0.45:1}}><CBx checked={task.completed} onToggle={onToggle}/><div style={{flex:1,cursor:"pointer"}} onClick={onToggle}><div style={{fontSize:14,fontWeight:600,color:C.dark,textDecoration:task.completed?"line-through":"none"}}>{task.taskName}</div><div style={{display:"flex",alignItems:"center",gap:6,marginTop:2,flexWrap:"wrap"}}>{task.room&&task.room!=="General"&&<span style={{fontSize:10,fontWeight:700,color:col,background:`${col}20`,padding:"2px 7px",borderRadius:20}}>{task.room}</span>}{dayLabel&&<span style={{fontSize:10,fontWeight:700,color:C.teal,background:"#E8F7F2",padding:"2px 7px",borderRadius:20}}>{dayLabel}</span>}{dateLabel&&<span style={{fontSize:10,fontWeight:700,color:"#7B5DD9",background:"#F5F0FF",padding:"2px 7px",borderRadius:20}}>{dateLabel}</span>}{task.months&&task.months!=="every"&&<span style={{fontSize:10,fontWeight:700,color:"#7B5DD9",background:"#F5F0FF",padding:"2px 7px",borderRadius:20}}>{task.months.slice(0,3)}</span>}</div></div><div style={{display:"flex",alignItems:"center",gap:3,color:C.greyText,fontSize:12,marginRight:4}}>{Ic.clock()}<span>{task.minutes}m</span></div><button type="button" onClick={e=>{e.stopPropagation();onEdit();}} style={{width:30,height:30,borderRadius:8,background:C.grey,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Ic.edit()}</button></div>);
}

function CelebrationModal({task,onDone}){
  const[frame,setFrame]=useState(0);
  const msgs=["Amazing work! 🎉","You crushed it! ⭐","Keep going! 🔥","Nailed it! 💪","Awesome! 🌟","You're on a roll! 🚀"];
  const[msg]=useState(()=>msgs[Math.floor(Math.random()*msgs.length)]);
  const particles=useState(()=>Array.from({length:18},(_,i)=>({
    x:Math.random()*100,y:Math.random()*40+10,
    emoji:["⭐","🌟","✨","🎉","💛","🎊","⭐","✦"][i%8],
    size:12+Math.random()*16,
    speed:0.3+Math.random()*0.5,
    drift:(Math.random()-0.5)*0.4,
  })))[0];
  const[pos,setPos]=useState(particles.map(p=>({x:p.x,y:p.y})));
  useEffect(()=>{
    const id=setInterval(()=>{
      setPos(prev=>prev.map((p,i)=>({
        x:p.x+particles[i].drift,
        y:p.y+particles[i].speed,
      })));
      setFrame(f=>f+1);
    },30);
    const dismiss=setTimeout(onDone,2600);
    return()=>{clearInterval(id);clearTimeout(dismiss);};
  },[]);
  return(
    <div onClick={onDone} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.55)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",maxWidth:430,margin:"0 auto"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,overflow:"hidden",pointerEvents:"none"}}>
        {particles.map((p,i)=>(
          <span key={i} style={{position:"absolute",left:pos[i].x+"%",top:(pos[i].y>100?-10:pos[i].y)+"%",fontSize:p.size,transition:"none",userSelect:"none",opacity:pos[i].y>90?Math.max(0,1-(pos[i].y-90)/10):1}}>{p.emoji}</span>
        ))}
      </div>
      <div style={{background:C.white,borderRadius:28,padding:"32px 28px",textAlign:"center",maxWidth:300,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",position:"relative",zIndex:1}}>
        <div style={{fontSize:64,marginBottom:8}}>🎉</div>
        <div style={{fontSize:22,fontWeight:900,color:C.dark,marginBottom:6}}>{msg}</div>
        <div style={{fontSize:15,color:C.greyText,marginBottom:20,lineHeight:1.4}}>{task.taskName}</div>
        <div style={{display:"flex",gap:16,marginBottom:16}}>
          {DC.map((c,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:c}}/>)}
        </div>
        <button type="button" onClick={onDone} style={{background:C.teal,border:"none",borderRadius:16,padding:"12px 32px",cursor:"pointer",fontFamily:"inherit",fontSize:15,fontWeight:700,color:C.white,width:"100%"}}>Keep it up! 🌿</button>
      </div>
    </div>
  );
}


function HomeScreen({tasks,setTasks,setSubScreen,setEditId,completedChores,setTab,todos,setTodos}){
  const now=new Date();
  const DOW=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getDay()];
  const dateNum=now.getDate();
  const lastDayNum=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const isLastDay=dateNum===lastDayNum;
  const curMonth=MONTHS_FULL[now.getMonth()];
  const ROOM_EMOJI={Kitchen:"🍳","Living Room":"🛋️",Bathroom:"🚿",Bedroom:"🛏️",Upstairs:"🏠",Downstairs:"🏚️",Garage:"🚗",Outdoor:"🌿",General:"🧹"};
  const MOTIVES=["Keep going, you are making great progress!","One task at a time, you've got this!","Small steps lead to big results!","You are building great habits!","Progress not perfection!"];
  const[motiveIdx]=useState(()=>Math.floor(Math.random()*MOTIVES.length));
  const dailyTasks=tasks.filter(t=>t.category==="Daily"&&t.day==="Today");
  const weeklyTasks=tasks.filter(t=>t.category==="Weekly"&&t.day===DOW);
  const monthlyTasks=tasks.filter(t=>{
    if(t.category!=="Monthly")return false;
    const m=t.months;
    const monthOk=m==="every"||(Array.isArray(m)?m.includes("every")||m.includes(curMonth):m===curMonth);
    if(!monthOk)return false;
    const dayNum=String(dateNum);
    if(t.day===("Day "+dateNum)||t.day===dayNum)return true;
    if(t.day==="Last day"&&isLastDay)return true;
    return false;
  });
  const allToday=[...dailyTasks,...weeklyTasks,...monthlyTasks];
  const done=allToday.filter(t=>t.completed).length;
  const total=allToday.length;
  const pct=total?Math.round((done/total)*100):0;
  const pendingMins=allToday.filter(t=>!t.completed).reduce((a,t)=>a+t.minutes,0);
  const[animating,setAnimating]=useState({});
  const todayKey=new Date().toISOString().split("T")[0];
  const[showCelebration,setShowCelebration]=useState(false);
  const[celebrationShown,setCelebrationShown]=useState(false);
  const[confetti]=useState(()=>Array.from({length:28},(_,i)=>({left:Math.floor(Math.random()*96)+2,size:6+Math.floor(Math.random()*8),isCircle:i%3!==0,color:["#4CAF8A","#E85B6A","#F39A3D","#F4C542","#8ECAD0","#7B5DD9"][i%6],dur:(2+Math.floor(Math.random()*20)/10).toFixed(1),delay:(Math.floor(Math.random()*15)/10).toFixed(1)})));
  const[celebrationTask,setCelebrationTask]=useState(null);
  const toggle=id=>{
    setAnimating(prev=>({...prev,[id]:"pop"}));
    setTimeout(()=>{setAnimating(prev=>{const n={...prev};delete n[id];return n;});},280);
    const u=tasks.map(t=>t.id===id?{...t,completed:!t.completed}:t);
    setTasks(u);LS.set("tasks",u);
    const td=new Date().toISOString().split("T")[0];
    const dates=LS.get("completedDates",[]);
    if(!dates.includes(td)){LS.set("completedDates",[...dates,td]);}
  };
  const completedDates=LS.get("completedDates",[]);
  let streak=0;
  for(let si=0;si<365;si++){
    const d=new Date(Date.now()-si*86400000).toISOString().split("T")[0];
    if(completedDates.includes(d)){streak++;}else if(si>0){break;}
  }
  const weekDays=["M","T","W","T","F","S","S"];
  const todayStr=new Date().toISOString().split("T")[0];
  const todosToday=(todos||[]).filter(t=>t.dueDate===todayStr);
  const toggleTodo=id=>{
    setAnimating(prev=>({...prev,[id]:"pop"}));
    setTimeout(()=>setAnimating(prev=>{const n={...prev};delete n[id];return n;}),280);
    const updated=(todos||[]).map(t=>t.id===id?{...t,completed:!t.completed}:t);
    setTodos(updated);LS.set("todoList",updated);
  };
  const allTasksDone=allToday.length>0&&allToday.every(t=>t.completed);
  const allTodosDone=todosToday.every(t=>t.completed);
  useEffect(()=>{
    if(allTasksDone&&allTodosDone&&!celebrationShown){
      setTimeout(()=>setShowCelebration(true),400);
      setCelebrationShown(true);
    }
    if(!allTasksDone||!allTodosDone){
      setCelebrationShown(false);
    }
  },[allTasksDone,allTodosDone]);
  const dismissCelebration=()=>{
    setShowCelebration(false);
  };
  const sorted=[...allToday,...todosToday.map(t=>({...t,_isTodo:true}))];
  const dailyDone=tasks.filter(t=>t.category==="Daily"&&t.completed).length;
  const dailyTotal=Math.max(tasks.filter(t=>t.category==="Daily").length,1);
  const weeklyDone=tasks.filter(t=>t.category==="Weekly"&&t.completed).length;
  const weeklyTotal=Math.max(tasks.filter(t=>t.category==="Weekly").length,1);
  const choreDone=(completedChores||[]).length;
  const choreTotal=Math.max(choreDone,12);

  return(
    <div style={{paddingBottom:80}}>
      <div style={{padding:"20px 20px 8px",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
        <img src="/icon.png" alt="" style={{width:108,height:108,flexShrink:0,objectFit:"contain",border:"none",background:"transparent"}} onError={e=>e.target.style.display="none"}/>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:22,fontWeight:900,letterSpacing:2,marginBottom:2,display:"flex",justifyContent:"flex-start",flexWrap:"wrap",gap:1}}>
            {["ADHD","CLEANING"].map((word,wi)=>(
              <span key={wi} style={{display:"flex",gap:1,marginRight:wi===0?8:0}}>
                {word.split("").map((ch,ci)=><span key={ci} style={{color:DC[(wi*4+ci)%DC.length]}}>{ch}</span>)}
              </span>
            ))}
          </div>
          <div style={{fontSize:22,fontWeight:900,color:C.dark,marginBottom:4,letterSpacing:2}}>CHECKLIST</div>
          <div style={{fontSize:12,color:C.greyText,fontWeight:500,marginBottom:8,letterSpacing:0.5}}>Clean home. Calm mind.</div>
          <div style={{display:"flex",justifyContent:"flex-start",gap:16}}>{DC.map((c,i)=><div key={i} style={{width:12,height:12,borderRadius:"50%",background:c}}/>)}</div>
        </div>
      </div>
      <div style={{margin:"12px 16px",background:"#E8F7F2",borderRadius:20,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
        <div style={{fontSize:13,fontWeight:800,color:C.teal,letterSpacing:0.5,marginBottom:10}}>TODAY'S PROGRESS</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:10}}>
          <div>
            <div style={{fontSize:36,fontWeight:900,color:"#4B5563",lineHeight:1}}>{pct}<span style={{fontSize:20}}>%</span></div>
            <div style={{fontSize:13,color:C.greyText,marginTop:4}}>{done} of {total} tasks done</div>
          </div>
          <div style={{flex:1}}>
            <div style={{height:12,background:"#C6EDD9",borderRadius:6,overflow:"hidden",marginBottom:8}}>
              <div style={{height:"100%",width:pct+"%",background:C.teal,borderRadius:6,transition:"width 0.5s"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.greyText}}>{Ic.clock(C.teal)}<span>{MOTIVES[motiveIdx]}</span></div>
          </div>
        </div>
        <div style={{position:"absolute",right:16,top:12,fontSize:40,opacity:0.7}}>🌿</div>
      </div>
      <div style={{margin:"12px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:15,fontWeight:800,color:C.dark}}>TODAY'S PLAN</span>
          <span style={{fontSize:12,fontWeight:700,color:C.teal}}>{done} of {total} tasks completed</span>
        </div>
        <div style={{background:C.white,borderRadius:20,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",overflow:"hidden"}}>
          {total===0&&<div style={{padding:"24px 16px",textAlign:"center",color:C.greyText,fontSize:14}}>No tasks today. Add one!</div>}
          {sorted.map((task,ti)=>{
            const col=RC[task.room]||C.greyText;
            const emoji=ROOM_EMOJI[task.room]||"🧹";
            return(
              <div key={task.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:ti<sorted.length-1?("1px solid "+C.border):"none",
                transition:"transform 0.14s ease-out, box-shadow 0.14s ease-out",
                transform:animating[task.id]==="pop"?"scale(1.04)":"scale(1)",
                boxShadow:animating[task.id]==="pop"?"0 6px 20px rgba(0,0,0,0.13)":"none",
                borderRadius:8,position:"relative",zIndex:animating[task.id]==="pop"?2:0,
                background:C.white}}>
                {task._isTodo?(
                  <div onClick={()=>toggleTodo(task.id)} style={{width:24,height:24,borderRadius:6,flexShrink:0,cursor:"pointer",border:"2px solid "+(task.completed?C.blue:C.border),background:task.completed?C.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {task.completed&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                ):(
                  <div onClick={()=>toggle(task.id)} style={{width:24,height:24,borderRadius:6,flexShrink:0,cursor:"pointer",border:"2px solid "+(task.completed?DC[ti%DC.length]:C.border),background:task.completed?DC[ti%DC.length]:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {task.completed&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                )}
                <div style={{width:38,height:38,borderRadius:10,background:(task._isTodo?C.blue:col)+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:20}}>{task._isTodo?"📝":emoji}</div>
                <div style={{flex:1,cursor:"pointer"}} onClick={()=>task._isTodo?toggleTodo(task.id):toggle(task.id)}>
                  <div style={{fontSize:14,fontWeight:700,color:C.dark,textDecoration:task.completed?"line-through":"none",opacity:task.completed?0.5:1}}>{task._isTodo?task.text:task.taskName}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:3}}>
                    {task._isTodo&&<span style={{fontSize:10,fontWeight:700,color:C.blue,background:C.blue+"20",padding:"2px 8px",borderRadius:20,display:"inline-block"}}>To-Do List</span>}
                    {!task._isTodo&&task.room&&task.room!=="General"&&<span style={{fontSize:10,fontWeight:700,color:col,background:col+"20",padding:"2px 8px",borderRadius:20,display:"inline-block"}}>{task.room}</span>}
                    {!task._isTodo&&task.category==="Weekly"&&task.day&&<span style={{fontSize:10,fontWeight:700,color:C.blue,background:C.blue+"20",padding:"2px 8px",borderRadius:20,display:"inline-block"}}>{task.day}</span>}
                    {!task._isTodo&&task.category==="Monthly"&&task.months&&task.months!=="every"&&!(Array.isArray(task.months)&&task.months.includes("every"))&&<span style={{fontSize:10,fontWeight:700,color:"#9B59B6",background:"#9B59B620",padding:"2px 8px",borderRadius:20,display:"inline-block"}}>{task.day==="Last day"?"Last day":(task.day.replace("Day ","")+" "+curMonth)}</span>}
                  </div>
                </div>
                {!task._isTodo&&<div style={{display:"flex",alignItems:"center",gap:3,color:C.greyText,fontSize:12}}>{Ic.clock()}<span>{task.minutes}m</span></div>}
                {!task._isTodo&&<button type="button" onClick={e=>{e.stopPropagation();setEditId(task.id);setSubScreen("editTask");}} style={{width:30,height:30,borderRadius:8,background:C.grey,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Ic.edit()}</button>}
              </div>
            );
          })}
          {total>0&&<button type="button" onClick={()=>setTab("tasks")} style={{width:"100%",background:"none",border:"none",borderTop:"1px solid "+C.border,padding:"12px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,color:C.coral,fontSize:13,fontWeight:700}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            View All Tasks
          </button>}
        </div>
      </div>
      <div style={{margin:"0 16px 12px",background:"#FFFBE0",borderRadius:20,padding:"16px 18px"}}>
        <div style={{fontSize:11,fontWeight:700,color:C.orange,letterSpacing:1,marginBottom:10}}>TODAY'S FOCUS</div>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{fontSize:44,flexShrink:0}}>🎯</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.dark,marginBottom:4}}>{Ic.clock(C.greyText)}<span>{pendingMins} minutes</span></div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.dark,marginBottom:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.greyText} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg><span>{total-done} tasks remaining</span></div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.dark}}><span>⭐</span><span>Most important first</span></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            <button type="button" onClick={()=>setSubScreen("haveTime")} style={{background:C.orange,border:"none",borderRadius:16,padding:"10px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:C.white,display:"flex",alignItems:"center",gap:6}}>✦ Start Session</button>
            <div style={{fontSize:11,color:C.greyText,textAlign:"right"}}>Guided cleaning.</div>
          </div>
        </div>
      </div>
      <div style={{margin:"0 16px 12px"}}>
        <div style={{fontSize:11,fontWeight:700,color:C.dark,letterSpacing:1,marginBottom:10}}>QUICK ACTIONS</div>
        <div style={{display:"flex",gap:10}}>
          <button type="button" onClick={()=>setSubScreen("haveTime")} style={{flex:1,background:"#E8F7F2",border:"2.5px solid #A8D9C8",borderRadius:20,padding:"18px 8px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><div style={{fontSize:13,fontWeight:700,color:C.teal}}>I Have Time</div></button>
          <button type="button" onClick={()=>setSubScreen("randomChore")} style={{flex:1,background:"#FEF3E2",border:"2.5px solid #F0C888",borderRadius:20,padding:"18px 8px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><DiceSvg size={38} color={C.orange}/><div style={{fontSize:13,fontWeight:700,color:C.orange}}>Random Chore</div><div style={{fontSize:10,color:C.greyText,textAlign:"center",lineHeight:1.3}}>Can't decide?<br/>We'll pick for you</div></button>
          <button type="button" onClick={()=>setSubScreen("addTask")} style={{flex:1,background:"#FDEEF1",border:"2.5px solid #F0A8B8",borderRadius:20,padding:"18px 8px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><div style={{fontSize:13,fontWeight:700,color:C.coral}}>Add Task</div><div style={{fontSize:10,color:C.greyText,textAlign:"center",lineHeight:1.3}}>Create your<br/>own task</div></button>
        </div>
      </div>
      <div style={{margin:"0 16px 10px",display:"flex",gap:10}}>
        <div style={{flex:1,background:"#FFF8F0",borderRadius:20,padding:"14px",border:"1px solid #FFE0A0"}}>
          <div style={{fontSize:11,fontWeight:700,color:C.orange,letterSpacing:1,marginBottom:8}}>CURRENT STREAK</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:28}}>🔥</span>
            <div style={{display:"flex",flexDirection:"column"}}>
              <div style={{fontSize:22,fontWeight:900,color:C.dark}}>{streak}<span style={{fontSize:14}}> days</span></div>
              <div style={{fontSize:11,color:C.greyText,marginTop:2}}>
                {streak===0?"Start your streak today!":streak===1?"Great start!":streak<=3?"Building momentum!":streak<=5?"You're on a roll!":streak<=7?"You're on fire! 🔥":streak<=13?"Amazing dedication!":"Unstoppable! 🌟"}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:4,justifyContent:"space-between"}}>
            {weekDays.map((d,wi)=>{
              const gc=[C.teal,"#52B882","#65C075","#7CC965","#94D054","#ABD644","#C2DA34"];
              return(
              <div key={wi} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <div style={{fontSize:8,color:C.greyText,fontWeight:700}}>{d}</div>
                <div style={{width:20,height:20,borderRadius:"50%",background:wi<streak?gc[wi]:C.border,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {wi<streak&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              </div>
              );
            })}
          </div>
        </div>
        <div style={{flex:1,background:"#F5FAFF",borderRadius:20,padding:"16px 14px",border:"1px solid #D8EEFF"}}>
          <div style={{fontSize:11,fontWeight:700,color:C.blue,letterSpacing:1,marginBottom:12}}>THIS MONTH</div>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:11,fontWeight:500,color:C.dark}}>Daily Tasks</span>
              <span style={{fontSize:11,fontWeight:700,color:C.dark}}>{dailyDone} / {dailyTotal}</span>
            </div>
            <div style={{height:10,background:C.grey,borderRadius:6,overflow:"hidden"}}>
              <div style={{height:"100%",width:Math.min(100,Math.round(dailyDone/dailyTotal*100))+"%",background:C.teal,borderRadius:6,transition:"width 0.4s"}}/>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:11,fontWeight:500,color:C.dark}}>Weekly Tasks</span>
              <span style={{fontSize:11,fontWeight:700,color:C.dark}}>{weeklyDone} / {weeklyTotal}</span>
            </div>
            <div style={{height:10,background:C.grey,borderRadius:6,overflow:"hidden"}}>
              <div style={{height:"100%",width:Math.min(100,Math.round(weeklyDone/weeklyTotal*100))+"%",background:C.orange,borderRadius:6,transition:"width 0.4s"}}/>
            </div>
          </div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:11,fontWeight:500,color:C.dark}}>Random Chores</span>
              <span style={{fontSize:11,fontWeight:700,color:C.dark}}>{choreDone} / {choreTotal}</span>
            </div>
            <div style={{height:10,background:C.grey,borderRadius:6,overflow:"hidden"}}>
              <div style={{height:"100%",width:Math.min(100,Math.round(choreDone/choreTotal*100))+"%",background:C.coral,borderRadius:6,transition:"width 0.4s"}}/>
            </div>
          </div>
        </div>
      </div>
      {(()=>{
        const tds=LS.get("todoList",[]);
        const now=new Date().toISOString().split("T")[0];
        const upcoming=tds.filter(t=>!t.completed&&t.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,3);
        const overdue=tds.filter(t=>!t.completed&&t.dueDate&&t.dueDate<now).length;
        if(upcoming.length===0)return null;
        return(
          <div style={{margin:"0 16px 12px",background:C.white,borderRadius:20,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:11,fontWeight:700,color:C.blue,letterSpacing:1}}>UPCOMING TO-DOS</span>
              {overdue>0&&<span style={{fontSize:10,fontWeight:700,color:C.coral,background:"#FDEEF1",padding:"2px 8px",borderRadius:20}}>{overdue} overdue</span>}
            </div>
            {upcoming.map(t=>{
              const diff=Math.ceil((new Date(t.dueDate)-new Date(now))/86400000);
              const col=diff<0?C.coral:diff===0?C.orange:diff<=2?"#B8860B":C.greyText;
              const label=diff<0?Math.abs(diff)+"d overdue":diff===0?"Today":diff===1?"Tomorrow":new Date(t.dueDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
              return(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid "+C.border}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:13,color:C.dark}}>{t.text}</span>
                  <span style={{fontSize:10,fontWeight:700,color:col}}>{label}</span>
                </div>
              );
            })}
            <button type="button" onClick={()=>setSubScreen("todoList")} style={{width:"100%",background:"none",border:"none",borderTop:"1px solid "+C.border,padding:"8px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:C.blue,marginTop:6}}>View all to-dos</button>
          </div>
        );
      })()}
      <div style={{margin:"0 16px 12px",background:"#F4FBF7",borderRadius:20,padding:"14px 18px",border:"1px solid #C8EDD9",display:"flex",alignItems:"center",gap:14}}>
        <span style={{fontSize:28,flexShrink:0}}>💚</span>
        <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:800,color:C.teal,marginBottom:3}}>Small steps. Big difference.</div>
          <div style={{fontSize:12,color:C.greyText}}>Every task you complete is a win!</div>
        </div>
        <span style={{fontSize:28,flexShrink:0}}>🌵</span>
      </div>
      {showCelebration&&(
        <div onClick={dismissCelebration} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(15,20,40,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",boxSizing:"border-box"}}>
          <style>{".cf{position:fixed;top:-20px;animation:fall var(--d)s var(--dl)s ease-in forwards}@keyframes fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}@keyframes popIn{0%{transform:scale(0.6);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}"}</style>
          {confetti.map((c,i)=>(
            <div key={i} className="cf" style={{"--d":c.dur,"--dl":c.delay,left:c.left+"%",width:c.size,height:c.size,borderRadius:c.isCircle?"50%":"3px",background:c.color}}/>
          ))}
          <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:28,padding:"32px 24px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",animation:"popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",position:"relative",zIndex:1001}}>
            <div style={{fontSize:56,marginBottom:8}}>🎉</div>
            <div style={{fontSize:26,fontWeight:900,color:C.dark,marginBottom:6}}>All Done!</div>
            <div style={{fontSize:15,color:C.greyText,lineHeight:1.6,marginBottom:20}}>
              Amazing work! You cleared every task on your list today. That is seriously impressive!
            </div>
            {streak>0&&<div style={{background:"#FFF8E0",borderRadius:16,padding:"10px 16px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <span style={{fontSize:22}}>🔥</span>
              <span style={{fontSize:14,fontWeight:700,color:C.orange}}>{streak} day streak — keep it going!</span>
            </div>}
            <button type="button" onClick={dismissCelebration} style={{background:C.teal,border:"none",borderRadius:16,padding:"14px 32px",cursor:"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700,color:C.white,width:"100%"}}>
              Woohoo! 🌟
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddTaskScreen({tasks,setTasks,onBack}){
  const s=data=>{
    let newTasks;
    if(data.category==="Weekly"&&data.days&&data.days.length>1){
      newTasks=data.days.map((day,i)=>({id:Date.now()+i,...data,day,days:undefined,completed:false}));
    }else if(data.category==="Monthly"&&data.months){
      const mArr=Array.isArray(data.months)?data.months:typeof data.months==="string"?[data.months]:["every"];
      if(mArr.includes("every")){
        newTasks=[{id:Date.now(),...data,months:"every",days:undefined,completed:false}];
      }else{
        newTasks=mArr.map((month,i)=>({id:Date.now()+i,...data,months:month,completed:false}));
      }
    }else{
      newTasks=[{id:Date.now(),...data,months:data.category==="Monthly"?"every":undefined,days:undefined,completed:false}];
    }
    const u=[...tasks,...newTasks];setTasks(u);LS.set("tasks",u);setTimeout(onBack,700);
  };
  return(<div style={{paddingBottom:80}}><Header title="Add New Task" color={C.coral} onBack={onBack}/><Dots/><TaskForm initial={{}} onSave={s} accent={C.coral} saveLabel="Save Task"/></div>);
}
function EditTaskScreen({tasks,setTasks,taskId,onBack}){
  const task=tasks.find(t=>t.id===taskId);
  if(!task){onBack();return null;}
  const s=data=>{
    const firstDay=data.category==="Weekly"&&data.days&&data.days.length>0?data.days[0]:data.day;
    let updated=tasks.map(t=>t.id===taskId?{...t,...data,day:firstDay,days:undefined}:t);
    if(data.category==="Weekly"&&data.days&&data.days.length>1){
      const extras=data.days.slice(1).map((day,i)=>({id:Date.now()+i+1,...data,day,days:undefined,completed:false}));
      updated=[...updated,...extras];
    }
    setTasks(updated);LS.set("tasks",updated);setTimeout(onBack,700);
  };
  const del=()=>{setTasks(tasks.filter(t=>t.id!==taskId));LS.set("tasks",tasks.filter(t=>t.id!==taskId));onBack();};
  return(<div style={{paddingBottom:80}}><Header title="Edit Task" color={C.blue} onBack={onBack}/><Dots/><TaskForm initial={task} onSave={s} onDelete={del} accent={C.blue} saveLabel="Save Changes"/></div>);}

function TasksScreen({tasks,setTasks,setSubScreen,setEditId}){
  const toggle=id=>{const u=tasks.map(t=>t.id===id?{...t,completed:!t.completed}:t);setTasks(u);LS.set("tasks",u);};
  const renderCat=cat=>{const ct=tasks.filter(t=>t.category===cat);if(!ct.length)return null;const sorted=[...ct].sort((a,b)=>daySort(a.day)-daySort(b.day));const groups=[];const seen=[];sorted.forEach(t=>{const k=t.day||"Unscheduled";if(!seen.includes(k)){seen.push(k);groups.push(k);}});return(<div key={cat} style={{margin:"0 16px 20px"}}><div style={{fontSize:11,fontWeight:700,color:C.greyText,letterSpacing:1,marginBottom:10}}>{cat.toUpperCase()}</div>{groups.map(dl=>{const dt=sorted.filter(t=>(t.day||"Unscheduled")===dl);const disp=cat==="Monthly"&&dl.startsWith("Day ")?`${ordinal(parseInt(dl.replace("Day ","")))} of month`:dl==="Last day"?"Last day of month":dl;return(<div key={dl} style={{marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{fontSize:11,fontWeight:700,color:C.teal}}>{disp.toUpperCase()}</div><div style={{flex:1,height:1,background:C.border}}/><div style={{fontSize:11,color:C.greyText}}>{dt.length} task{dt.length!==1?"s":""}</div></div><div style={{background:C.white,borderRadius:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>{dt.map((task,i)=><TaskRow key={task.id} task={task} isLast={i===dt.length-1} showDay onToggle={()=>toggle(task.id)} onEdit={()=>{setEditId(task.id);setSubScreen("editTask");}}/>)}</div></div>);})}</div>);};
  return(<div style={{paddingBottom:80}}><div style={{padding:"20px 20px 8px",textAlign:"center"}}><h2 style={{margin:"0 0 6px",fontSize:30,fontWeight:900,letterSpacing:1,color:C.coral,textTransform:"uppercase"}}>All Tasks</h2></div><Dots/>{["Daily","Weekly","Monthly"].map(cat=>renderCat(cat))}<div style={{padding:"0 16px 8px"}}><button type="button" onClick={()=>setSubScreen("addTask")} style={{background:C.coral,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}}><div style={{width:32,height:32,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="3.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><span style={{fontSize:18,fontWeight:700,color:C.white}}>Add New Task</span></button></div></div>);
}

function HaveTimeScreen({timeChores,setTimeChores,setSubScreen,onBack}){
  const[time,setTime]=useState(30);const[show,setShow]=useState(false);
  const save=u=>{setTimeChores(u);LS.set("timeChores",u);};const toggle=id=>save(timeChores.map(c=>c.id===id?{...c,completed:!c.completed}:c));
  const avail=timeChores.filter(t=>!t.completed&&t.minutes<=time).sort((a,b)=>a.minutes-b.minutes);const done=timeChores.filter(t=>t.completed&&t.minutes<=time);
  return(<div style={{paddingBottom:80}}><Header title="I Have Time For" color={C.teal} onBack={onBack}/><Dots/><div style={{textAlign:"center",padding:"0 20px 20px"}}><div style={{fontSize:15,color:C.dark,fontWeight:600,marginBottom:20}}>How much time do you have?</div><LargeStepper value={time} onChange={v=>{setTime(v);setShow(false);}} accent={C.teal}/><button type="button" onClick={()=>setShow(true)} style={{marginTop:24,background:C.teal,color:C.white,border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%",fontSize:18,fontWeight:700}}>Show Me Tasks</button><button type="button" onClick={()=>setSubScreen("myTimeChores")} style={{marginTop:10,background:C.grey,color:C.dark,border:"none",borderRadius:16,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{fontSize:22}}>⚙️</span><span>Manage My Tasks</span></button></div>{show&&(<div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>{done.length>0&&<div style={{background:`linear-gradient(135deg,${C.teal},#3a9e76)`,borderRadius:16,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:C.white}}><div style={{fontSize:18,fontWeight:800}}>{done.length} done ✓</div><div style={{fontSize:12,opacity:0.85}}>{done.reduce((a,t)=>a+t.minutes,0)} min completed</div></div><div style={{fontSize:28}}>🙌</div></div>}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:700,color:C.teal}}>{avail.length} task{avail.length!==1?"s":""} available</div><button type="button" onClick={()=>setSubScreen("addTimeChore")} style={{fontSize:12,color:C.teal,background:"none",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>+ Add task</button></div>{timeChores.length===0&&<div style={{background:C.white,borderRadius:20,padding:24,textAlign:"center"}}><div style={{fontSize:14,color:C.greyText}}>No tasks yet. Add some!</div></div>}{timeChores.every(t=>t.completed)&&timeChores.length>0&&<div style={{background:C.white,borderRadius:20,padding:24,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{fontSize:14,fontWeight:700,color:C.dark}}>All completed!</div></div>}{!timeChores.every(t=>t.completed)&&avail.length===0&&timeChores.length>0&&<div style={{background:C.white,borderRadius:20,padding:24,textAlign:"center",color:C.greyText,fontSize:14}}>No tasks fit in {time} min.</div>}{avail.length>0&&<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:12,fontWeight:800,color:C.dark,letterSpacing:1}}>TO DO</span><div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:C.greyText}}>{avail.length}</span></div><div style={{background:C.white,borderRadius:20,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",overflow:"hidden"}}>{avail.map((t,i)=>(<div key={t.id} onClick={()=>toggle(t.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",borderBottom:i<avail.length-1?`1px solid ${C.border}`:"none"}}><CBx checked={false} onToggle={()=>toggle(t.id)} color={DC[i%DC.length]}/><div style={{flex:1,fontSize:14,fontWeight:600,color:C.dark}}>{t.choreName}</div><div style={{display:"flex",alignItems:"center",gap:3,color:C.greyText,fontSize:12}}>{Ic.clock()}<span>{t.minutes} min</span></div></div>))}</div></div>}{done.length>0&&<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:12,fontWeight:800,color:C.teal,letterSpacing:1}}>DONE</span><div style={{flex:1,height:1,background:"#C6EDD9"}}/><span style={{fontSize:12,color:C.greyText}}>{done.length}</span></div><div style={{background:"#F0FBF6",borderRadius:20,border:"1.5px solid #C6EDD9",overflow:"hidden"}}>{done.map((t,i)=>(<div key={t.id} onClick={()=>toggle(t.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",borderBottom:i<done.length-1?"1px solid #C6EDD9":"none"}}><CBx checked={true} onToggle={()=>toggle(t.id)} color={DC[i%DC.length]}/><div style={{flex:1,fontSize:14,fontWeight:600,color:C.greyText,textDecoration:"line-through"}}>{t.choreName}</div><div style={{display:"flex",alignItems:"center",gap:3,color:C.greyText,fontSize:12}}>{Ic.clock()}<span>{t.minutes} min</span></div></div>))}</div></div>}{avail.length===0&&done.length>0&&<div style={{background:"linear-gradient(135deg,#FFF9E6,#FFF3CC)",borderRadius:16,padding:"20px 24px",textAlign:"center",border:`1.5px solid ${C.yellow}`}}><div style={{fontSize:32,marginBottom:8}}>🎉</div><div style={{fontSize:16,fontWeight:800,color:C.dark}}>All done!</div></div>}</div>)}</div>);
}

function MyTimeChoresScreen({timeChores,setTimeChores,setSubScreen,onBack}){
  const save=u=>{setTimeChores(u);LS.set("timeChores",u);};const toggle=id=>save(timeChores.map(c=>c.id===id?{...c,completed:!c.completed}:c));const del=id=>save(timeChores.filter(c=>c.id!==id));const reset=()=>save(timeChores.map(c=>({...c,completed:false})));const todo=timeChores.filter(c=>!c.completed).sort((a,b)=>a.minutes-b.minutes);const done=timeChores.filter(c=>c.completed).sort((a,b)=>a.minutes-b.minutes);
  return(<div style={{paddingBottom:80}}><Header title="My Quick Tasks" color={C.teal} onBack={onBack} fs={24}/><Dots/><div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:16}}><div style={{fontSize:13,color:C.greyText}}>Tap a checkbox to mark done. Completed tasks won't appear in "I Have Time" until reset.</div>{timeChores.length===0&&<div style={{background:C.white,borderRadius:20,padding:24,textAlign:"center"}}><div style={{fontSize:13,color:C.greyText}}>No quick tasks yet. Add one below!</div></div>}{todo.length>0&&<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:12,fontWeight:800,color:C.dark,letterSpacing:1}}>TO DO</span><div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:C.greyText}}>{todo.length} task{todo.length!==1?"s":""}</span></div><div style={{background:C.white,borderRadius:20,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>{todo.map((c,i)=>(<div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:i<todo.length-1?`1px solid ${C.border}`:"none"}}><CBx checked={false} onToggle={()=>toggle(c.id)} color={DC[i%DC.length]}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.dark}}>{c.choreName}</div><div style={{fontSize:12,color:C.greyText}}>{c.minutes} min</div></div><button type="button" onClick={e=>{e.stopPropagation();del(c.id);}} style={{border:"none",background:"none",cursor:"pointer",padding:4}}>{Ic.trash()}</button></div>))}</div></div>}{done.length>0&&<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:12,fontWeight:800,color:C.teal,letterSpacing:1}}>DONE</span><div style={{flex:1,height:1,background:"#C6EDD9"}}/><span style={{fontSize:12,color:C.greyText}}>{done.length} completed</span></div><div style={{background:"#F0FBF6",borderRadius:20,border:"1.5px solid #C6EDD9",overflow:"hidden"}}>{done.map((c,i)=>(<div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:i<done.length-1?"1px solid #C6EDD9":"none",background:"#F0FBF6"}}><CBx checked={true} onToggle={()=>toggle(c.id)} color={DC[i%DC.length]}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.greyText,textDecoration:"line-through"}}>{c.choreName}</div><div style={{fontSize:12,color:C.greyText}}>{c.minutes} min</div></div><button type="button" onClick={e=>{e.stopPropagation();del(c.id);}} style={{border:"none",background:"none",cursor:"pointer",padding:4}}>{Ic.trash()}</button></div>))}</div><button type="button" onClick={reset} style={{width:"100%",marginTop:12,background:C.white,color:C.teal,border:`2px solid ${C.teal}`,borderRadius:14,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{Ic.refresh()}<span>Reset All to To Do</span></button></div>}<button type="button" onClick={()=>setSubScreen("addTimeChore")} style={{background:C.teal,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}}><div style={{width:32,height:32,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="3.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><span style={{fontSize:18,fontWeight:700,color:C.white}}>Add New Quick Task</span></button></div></div>);
}
function AddTimeChoreScreen({timeChores,setTimeChores,onBack}){const[name,setName]=useState("");const[minutes,setMinutes]=useState(10);const[saved,setSaved]=useState(false);const add=()=>{if(!name.trim())return;const u=[...timeChores,{id:Date.now(),choreName:name.trim(),minutes,completed:false}];setTimeChores(u);LS.set("timeChores",u);setSaved(true);setTimeout(onBack,600);};return(<div style={{paddingBottom:80}}><Header title="Add Quick Task" color={C.teal} onBack={onBack}/><Dots/><div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:16}}><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:6}}>Task Name</label><input style={{width:"100%",padding:"13px 16px",border:`1px solid ${C.border}`,borderRadius:12,fontSize:14,fontFamily:"inherit",color:C.dark,background:C.white,boxSizing:"border-box",outline:"none"}} placeholder="e.g., Wipe down stovetop" value={name} onChange={e=>setName(e.target.value)}/></div><div style={{textAlign:"center"}}><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:8}}>Time (minutes)</label><div style={{display:"flex",justifyContent:"center"}}><Stepper value={minutes} onChange={setMinutes} accent={C.teal}/></div></div><div style={{background:"#E8F7F2",borderRadius:14,padding:"12px 16px",display:"flex",gap:10}}><span style={{fontSize:18}}>💡</span><div style={{fontSize:13,color:C.dark}}>Keep these short — things you can knock out in a spare 5–30 minutes.</div></div><button type="button" onClick={add} style={{background:saved?C.teal:"#3a9e76",color:C.white,border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{saved?"✓ Added!":"Add Task"}</button></div></div>);}

function RandomChoreScreen({randomChores,completedChores,setCompletedChores,onBack}){
  const[time,setTime]=useState(20);const[chore,setChore]=useState(null);const[confirmed,setConfirmed]=useState(false);
  const[quote,setQuote]=useState(()=>MOTIVATIONAL_QUOTES[Math.floor(Math.random()*MOTIVATIONAL_QUOTES.length)]);
  const find=()=>{const pool=randomChores.filter(c=>c.minutes<=time);if(!pool.length){setChore(null);return;}setChore(pool[Math.floor(Math.random()*pool.length)]);setConfirmed(false);};
  const markDone=()=>{const u=[{choreName:chore.choreName,minutes:chore.minutes,completedDate:TODAY},...completedChores];setCompletedChores(u);LS.set("completedChores",u);setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random()*MOTIVATIONAL_QUOTES.length)]);setConfirmed(true);};
  return(<div style={{paddingBottom:80}}><Header title="Random Chore" color={C.orange} onBack={onBack}/><Dots/>{!chore?(<div style={{padding:"0 20px",textAlign:"center"}}><div style={{fontSize:15,color:C.dark,fontWeight:600,marginBottom:20}}>How much time do you have?</div><LargeStepper value={time} onChange={setTime} accent={C.orange}/><button type="button" onClick={find} style={{marginTop:24,background:C.orange,color:C.white,border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%",fontSize:18,fontWeight:700}}>Find Random Chore</button></div>):confirmed?(<div style={{padding:"0 20px",textAlign:"center"}}><div style={{background:"#F2FBF8",borderRadius:20,padding:"36px 24px",marginBottom:12,border:"1.5px solid #C6EDD9"}}><div style={{width:88,height:88,borderRadius:"50%",background:C.teal,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div style={{fontSize:22,fontWeight:800,color:C.dark,marginBottom:12}}>Nice work!</div><div style={{fontSize:13,fontWeight:400,color:C.greyText,marginBottom:6}}>You completed</div><div style={{fontSize:28,fontWeight:800,color:C.teal}}>{chore.choreName}</div></div><div style={{background:"#F2FBF8",borderRadius:20,padding:"20px",marginBottom:16,border:"1.5px solid #C6EDD9",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><svg width="18" height="18" viewBox="0 0 24 24" fill={C.teal} stroke={C.teal} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span style={{fontSize:14,color:C.dark,lineHeight:1.5,textAlign:"center"}}>{quote}</span></div><button type="button" onClick={()=>{setChore(null);setConfirmed(false);}} style={{width:"100%",background:C.white,color:C.dark,border:`2px solid ${C.border}`,borderRadius:16,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>{Ic.arrows()}<span>Find Another</span></button></div>):(<div style={{padding:"0 16px",textAlign:"center"}}>
      <div style={{background:"#FFFAF5",borderRadius:24,padding:"28px 20px 24px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <span style={{position:"absolute",top:36,left:36,fontSize:40,color:C.yellow}}>✦</span>
        <span style={{position:"absolute",top:24,right:44,fontSize:28,color:C.coral}}>✦</span>
        <span style={{position:"absolute",top:52,right:28,fontSize:36,color:C.yellow,opacity:0.7}}>✦</span>
        <span style={{position:"absolute",bottom:40,left:28,fontSize:32,color:C.teal,opacity:0.8}}>✦</span>
        <span style={{position:"absolute",bottom:28,right:36,fontSize:24,color:C.orange,opacity:0.7}}>✦</span>
        <span style={{position:"absolute",top:70,left:24,fontSize:20,color:C.coral,opacity:0.6}}>◆</span>
        <span style={{position:"absolute",top:60,right:22,fontSize:20,color:C.teal,opacity:0.6}}>◆</span>
        <span style={{position:"absolute",bottom:52,left:44,fontSize:16,color:C.orange,opacity:0.5}}>◆</span>
        <div style={{fontSize:90,marginBottom:16,display:"flex",justifyContent:"center"}}>{chore.emoji||choreIcon(chore.choreName)}</div>
        <div style={{fontSize:28,fontWeight:800,color:C.dark,marginBottom:8,lineHeight:1.3}}>{chore.choreName}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,color:C.greyText,fontSize:15}}>{Ic.clock()}<span>{chore.minutes} min</span></div>
      </div>
      <button type="button" onClick={markDone} style={{width:"100%",background:C.orange,border:"none",borderRadius:20,padding:"18px",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10,marginLeft:10,marginRight:10,display:"flex",alignItems:"center",justifyContent:"center",gap:10,color:C.white}}>I'll Do It! 🚀</button>
      <button type="button" onClick={find} style={{width:"calc(100% - 20px)",background:C.white,color:C.dark,border:`2px solid ${C.border}`,borderRadius:20,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12,marginLeft:10,marginRight:10}}>{Ic.arrows()}<span>Show Another</span></button>
      <div style={{background:"#FEF3E2",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"#FFE0B2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Ic.clock(C.orange)}</div>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.dark}}>You've got this!</div><div style={{fontSize:12,color:C.greyText,marginTop:2}}>{quote}</div></div>
        <span style={{fontSize:20,flexShrink:0}}>🧡</span>
      </div>
    </div>)}</div>);
}

function MyRandomChoresScreen({randomChores,setRandomChores,setSubScreen,onBack}){const del=id=>{const u=randomChores.filter(c=>c.id!==id);setRandomChores(u);LS.set("randomChores",u);};return(<div style={{paddingBottom:80}}><Header title="My Random Chores" color={C.orange} onBack={onBack} fs={22}/><Dots/><div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}><div style={{fontSize:13,color:C.greyText}}>These chores are used for random picks.</div><div style={{background:C.white,borderRadius:20,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",overflow:"hidden"}}>{randomChores.length===0?<div style={{padding:24,textAlign:"center",color:C.greyText}}>No random chores yet. Add one below!</div>:randomChores.map((c,i)=>(<div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:i<randomChores.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:22,flexShrink:0}}>{c.emoji||choreIcon(c.choreName)}</span><div style={{flex:1,fontSize:14,fontWeight:600,color:C.dark}}>{c.choreName}</div><div style={{fontSize:12,color:C.greyText,marginRight:8}}>{c.minutes} min</div><button type="button" onClick={()=>del(c.id)} style={{border:"none",background:"none",cursor:"pointer",padding:4}}>{Ic.trash()}</button></div>))}</div><button type="button" onClick={()=>setSubScreen("addRandomChore")} style={{background:C.orange,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}}><div style={{width:32,height:32,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="3.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><span style={{fontSize:18,fontWeight:700,color:C.white}}>Add New Random Chore</span></button></div></div>);}

function AddRandomChoreScreen({randomChores,setRandomChores,onBack}){
  const[name,setName]=useState("");const[minutes,setMinutes]=useState(15);const[saved,setSaved]=useState(false);const[emoji,setEmoji]=useState("🧹");
  const recommended=choreIcon(name);const emojiList=recommended!=="🧹"?[recommended,...ALL_EMOJIS.filter(e=>e!==recommended)]:ALL_EMOJIS;
  const add=()=>{if(!name.trim())return;const u=[...randomChores,{id:Date.now(),choreName:name.trim(),minutes,emoji}];setRandomChores(u);LS.set("randomChores",u);setSaved(true);setTimeout(onBack,600);};
  const inp={width:"100%",padding:"13px 16px",border:`1px solid ${C.border}`,borderRadius:12,fontSize:14,fontFamily:"inherit",color:C.dark,background:C.white,boxSizing:"border-box",outline:"none"};
  return(<div style={{paddingBottom:80}}><Header title="Add Random Chore" color={C.orange} onBack={onBack} fs={22}/><Dots/><div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:16}}><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:6}}>Chore Name</label><input style={inp} placeholder="e.g., Clean baseboards" value={name} onChange={e=>{setName(e.target.value);setEmoji(choreIcon(e.target.value));}}/></div><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:8}}>Icon <span style={{fontSize:12,color:C.greyText,fontWeight:400}}>— recommended shown first</span></label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{emojiList.map((e,i)=>(<button type="button" key={e+i} onClick={()=>setEmoji(e)} style={{width:44,height:44,borderRadius:12,border:`2px solid ${emoji===e?C.orange:C.border}`,background:emoji===e?"#FFF3E0":C.white,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>{e}{i===0&&<span style={{position:"absolute",top:-4,right:-4,background:C.orange,color:C.white,fontSize:8,fontWeight:800,borderRadius:6,padding:"1px 4px",lineHeight:"12px"}}>✓</span>}</button>))}</div></div><div><label style={{fontSize:13,fontWeight:600,color:C.dark,display:"block",marginBottom:8}}>Time (minutes)</label><Stepper value={minutes} onChange={setMinutes} accent={C.orange}/></div><button type="button" onClick={add} style={{background:saved?C.teal:C.orange,color:C.white,border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{saved?"✓ Added!":"Add Chore"}</button></div></div>);
}

function CompletedRandomChoresScreen({completedChores,onBack}){
  const[filter,setFilter]=useState("This Week");const now=new Date();const weekAgo=new Date(now-7*86400000).toISOString().split("T")[0];const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0];
  const countFor=(name,period)=>completedChores.filter(c=>{if(c.choreName!==name)return false;if(period==="This Week")return c.completedDate>=weekAgo;if(period==="This Month")return c.completedDate>=monthStart;return true;}).length;
  const filtered=completedChores.filter(c=>{if(filter==="This Week")return c.completedDate>=weekAgo;if(filter==="This Month")return c.completedDate>=monthStart;return true;});
  const uniqueNames=[...new Set(filtered.map(c=>c.choreName))];const sorted=[...uniqueNames].sort((a,b)=>countFor(b,filter)-countFor(a,filter));
  const fmt=d=>{if(d===TODAY)return"Today";const y=new Date(Date.now()-86400000).toISOString().split("T")[0];if(d===y)return"Yesterday";return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});};
  const lastDone=name=>{const entries=completedChores.filter(c=>c.choreName===name).sort((a,b)=>b.completedDate.localeCompare(a.completedDate));return entries.length?fmt(entries[0].completedDate):"";};
  return(<div style={{paddingBottom:80}}><Header title="Completed Chores" color={C.orange} onBack={onBack} fs={24}/><Dots/><div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:14}}><div style={{display:"flex",gap:8}}>{[["This Week",C.orange],["This Month",C.yellow],["All Time",C.coral]].map(([f,fc])=>(<button type="button" key={f} onClick={()=>setFilter(f)} style={{flex:1,padding:"10px 4px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,background:filter===f?fc:C.grey,color:filter===f?C.white:C.dark}}>{f}</button>))}</div><div style={{textAlign:"center"}}><div style={{fontSize:36,fontWeight:900,color:C.dark}}>{filtered.length}</div><div style={{fontSize:13,color:C.greyText}}>completions {filter.toLowerCase()}</div></div>{sorted.length===0?(<div style={{background:C.white,borderRadius:20,padding:24,textAlign:"center",color:C.greyText}}>No completed chores yet.</div>):(<div style={{background:C.white,borderRadius:20,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",overflow:"hidden"}}>{sorted.map((name,i)=>{const thisWeek=countFor(name,"This Week"),thisMonth=countFor(name,"This Month"),allTime=countFor(name,"All Time"),col=DC[i%DC.length];return(<div key={name} style={{padding:"14px 16px",borderBottom:i<sorted.length-1?`1px solid ${C.border}`:"none"}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}><div style={{width:32,height:32,borderRadius:"50%",background:col,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ic.check()}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.dark}}>{name}</div><div style={{fontSize:11,color:C.greyText}}>Last done: {lastDone(name)}</div></div></div><div style={{display:"flex",gap:8}}>{[["This Week",thisWeek,"#FFF3E0",C.orange],["This Month",thisMonth,"#FFFBE0",C.yellow],["All Time",allTime,"#FDEAEC",C.coral]].map(([label,count,bg,tc])=>(<div key={label} style={{flex:1,background:bg,borderRadius:10,padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:tc}}>{count}</div><div style={{fontSize:10,color:C.greyText,fontWeight:600}}>{label}</div></div>))}</div></div>);})}</div>)}</div></div>);
}

function RandomTab({randomChores,setRandomChores,completedChores,setCompletedChores,setSubScreen}){return(<div style={{paddingBottom:80}}>
  <div style={{padding:"20px 20px 8px",textAlign:"center"}}><h2 style={{margin:"0 0 6px",fontSize:30,fontWeight:900,letterSpacing:1,color:C.orange,textTransform:"uppercase"}}>Random Chores</h2></div>
  <Dots/>
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginBottom:20,marginTop:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:24}}>
      <span style={{fontSize:40,color:C.yellow,opacity:0.8}}>✦</span>
      <DiceSvg size={144} color={C.orange}/>
      <span style={{fontSize:40,color:C.yellow,opacity:0.8}}>✦</span>
    </div>
    <p style={{margin:0,fontSize:15,color:C.greyText,lineHeight:1.5,textAlign:"center"}}>Don't know what to do?<br/>Let's pick something for you!</p>
  </div>
  <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
    <button type="button" onClick={()=>setSubScreen("randomChore")} style={{background:C.orange,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}}><div style={{width:32,height:32,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><DiceSvg size={18} color={C.orange}/></div><span style={{fontSize:18,fontWeight:700,color:C.white}}>Find a Random Chore</span></button>
    <button type="button" onClick={()=>setSubScreen("myRandomChores")} style={{marginTop:4,background:C.grey,color:C.dark,border:"none",borderRadius:16,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{fontSize:22}}>⚙️</span><span>Manage My Chores</span></button>
  </div>
</div>);}

function ProgressScreen({tasks,completedChores,setSubScreen}){
  const tt=tasks.filter(t=>t.day==="Today");const done=tt.filter(t=>t.completed).length,total=tt.length;const pct=total?Math.round((done/total)*100):0;const minsDone=tt.filter(t=>t.completed).reduce((a,t)=>a+t.minutes,0);
  const weekDays=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];const barC=[C.orange,C.yellow,C.coral,C.teal,C.blue,C.orange,C.yellow];
  const completedDates=LS.get("completedDates",[]);
  const barH=weekDays.map((_,i)=>{const d=new Date();const day=d.getDay();const diff=i-(day===0?6:day-1);const dt=new Date(d);dt.setDate(dt.getDate()+diff);const ds=dt.toISOString().split("T")[0];return completedDates.includes(ds)?100:0;});
  const barV=barH.map(h=>h>0?1:0);
  const[activeBar,setActiveBar]=useState(null);
  const dailyDone=tasks.filter(t=>t.category==="Daily"&&t.completed).length;
  const dailyTotal=Math.max(tasks.filter(t=>t.category==="Daily").length,1);
  const weeklyDone=tasks.filter(t=>t.category==="Weekly"&&t.completed).length;
  const weeklyTotal=Math.max(tasks.filter(t=>t.category==="Weekly").length,1);
  const monthlyDone=tasks.filter(t=>t.category==="Monthly"&&t.completed).length;
  const monthlyTotal=Math.max(tasks.filter(t=>t.category==="Monthly").length,1);
  const tdList=LS.get("todoList",[]);
  const tdDone=tdList.filter(t=>t.completed).length;
  const tdTotal=Math.max(tdList.length,1);
  const cats=[{label:"Daily Tasks",done:dailyDone,total:dailyTotal,color:C.orange},{label:"Weekly Tasks",done:weeklyDone,total:weeklyTotal,color:C.yellow},{label:"Monthly Tasks",done:monthlyDone,total:monthlyTotal,color:C.coral},{label:"Random Chores",done:completedChores.length,total:Math.max(completedChores.length,12),color:C.teal},{label:"To-Do List",done:tdDone,total:tdTotal,color:C.blue}];
  const rooms=ROOMS.filter(r=>tasks.some(t=>t.room===r));
    let streak=0;for(let i=0;i<365;i++){const d=new Date(Date.now()-i*86400000).toISOString().split("T")[0];if(completedDates.includes(d)){streak++;}else if(i>0){break;}}
  return(<div style={{paddingBottom:80}} onClick={()=>setActiveBar(null)}><div style={{padding:"20px 20px 8px",textAlign:"center"}}><h2 style={{margin:"0 0 6px",fontSize:30,fontWeight:900,letterSpacing:1,color:C.teal,textTransform:"uppercase"}}>Progress</h2></div><Dots/><div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:14}}><div style={{background:C.white,borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}><div style={{fontSize:11,fontWeight:700,color:C.teal,letterSpacing:1,marginBottom:12}}>TODAY'S PROGRESS</div><ProgressBar pct={pct} done={done} total={total} minsDone={minsDone} accent={C.teal} accentEnd="#3a9e76"/></div><div style={{background:C.white,borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}><div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:14}}>By Day (This Week)</div><div style={{display:"flex",alignItems:"flex-end",gap:8,height:140}}>{weekDays.map((d,i)=>(<div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",position:"relative"}} onClick={e=>{e.stopPropagation();setActiveBar(activeBar===i?null:i);}}>{activeBar===i&&(<div style={{position:"absolute",top:-32,left:"50%",transform:"translateX(-50%)",background:C.dark,color:C.white,fontSize:11,fontWeight:700,borderRadius:8,padding:"4px 8px",whiteSpace:"nowrap",zIndex:10}}>{barV[i]} task{barV[i]!==1?"s":""}<div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:`5px solid ${C.dark}`}}/></div>)}<div style={{width:"100%",borderRadius:6,background:barC[i],minHeight:4,height:barH[i],opacity:activeBar!==null&&activeBar!==i?0.4:1}}/><div style={{fontSize:10,color:activeBar===i?barC[i]:C.greyText,fontWeight:activeBar===i?800:600,whiteSpace:"nowrap"}}>{d}</div></div>))}</div><div style={{fontSize:11,color:C.greyText,marginTop:8,textAlign:"center"}}>Tap a bar to see the count</div></div><div style={{background:"linear-gradient(135deg,#FFF8F0,#FFF0DC)",borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)",border:"1.5px solid #FFE0A0"}}><div style={{fontSize:11,fontWeight:700,color:C.orange,letterSpacing:1,marginBottom:14}}>CURRENT STREAK</div><div style={{display:"flex",alignItems:"center",gap:16}}><div style={{fontSize:44,lineHeight:1,flexShrink:0}}>🔥</div><div style={{flex:1}}><div style={{fontSize:34,fontWeight:900,color:C.dark,lineHeight:1}}>{streak} <span style={{fontSize:20,fontWeight:700}}>{streak===1?"day":"days"}</span></div><div style={{fontSize:13,color:"#7A5C2E",marginTop:5,fontWeight:600}}>{streak===0?"Start your streak today!":streak===1?"Great start — keep it going!":streak<5?"Nice work! Keep it up!":streak<10?"You're on fire!":"Absolutely unstoppable!"}</div></div></div>{streak>0&&<div style={{marginTop:14,display:"flex",gap:6,flexWrap:"wrap"}}>{Array.from({length:Math.min(streak,7)},(_,i)=>(<div key={i} style={{width:30,height:30,borderRadius:"50%",background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🔥</div>))}{streak>7&&<div style={{width:30,height:30,borderRadius:"50%",background:"#FFD580",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:C.dark}}>+{streak-7}</div>}</div>}</div><div style={{background:C.white,borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}><div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:14}}>This Month</div>{cats.map(cat=>(<div key={cat.label} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:C.dark}}>{cat.label}</span><span style={{fontSize:13,fontWeight:700,color:C.dark}}>{cat.done}/{cat.total}</span></div><div style={{height:8,background:C.grey,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(cat.done/cat.total)*100}%`,background:cat.color,borderRadius:4}}/></div></div>))}</div><div style={{background:C.white,borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}><div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:14}}>By Room / Area</div>{rooms.length===0?<div style={{fontSize:13,color:C.greyText,textAlign:"center",padding:"8px 0"}}>Add rooms to your tasks to see a breakdown here.</div>:rooms.map((r,ri)=>{const rt=tasks.filter(t=>t.room===r),rd=rt.filter(t=>t.completed).length,rp=rt.length?Math.round((rd/rt.length)*100):0,col=DC[ri%DC.length];return(<div key={r} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:"50%",background:col}}/><span style={{fontSize:13,fontWeight:600,color:C.dark}}>{r}</span></div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:C.greyText}}>{rd}/{rt.length}</span><span style={{fontSize:12,fontWeight:700,color:col}}>{rp}%</span></div></div><div style={{height:8,background:C.grey,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${rp}%`,background:col,borderRadius:4,transition:"width 0.4s"}}/></div></div>);})}</div><button type="button" onClick={()=>setSubScreen("completedChores")} style={{background:C.teal,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}}><div style={{width:32,height:32,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><span style={{fontSize:18,fontWeight:700,color:C.white}}>Completed Chores</span></button></div></div>);
}

function SpeedCleanTab({setSubScreen,onBack}){return(<div style={{paddingBottom:80}}><Header title="Speed Cleaning" color={C.teal} onBack={onBack} fs={24}/><Dots/><div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}><div style={{background:C.white,borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}><div style={{fontSize:13,color:C.greyText,lineHeight:1.6}}>Choose your speed cleaning mode — pick by how much time you have, or go room by room.</div></div><button type="button" onClick={()=>setSubScreen("speedCleanTime")} style={{background:"#E8F7F2",border:"1.5px solid #A8D9C8",borderRadius:20,padding:"20px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:14,width:"100%",textAlign:"left"}}><span style={{fontSize:32,flexShrink:0}}>⏱️</span><div style={{flex:1}}><div style={{fontSize:17,fontWeight:800,color:C.teal}}>By Time</div><div style={{fontSize:12,color:C.greyText,marginTop:3}}>5, 10, 20, 30, 45, 60 or 90 minutes</div></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.greyText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button><button type="button" onClick={()=>setSubScreen("speedCleanRoom")} style={{background:"#FEF3E2",border:"1.5px solid #F0C888",borderRadius:20,padding:"20px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:14,width:"100%",textAlign:"left"}}><span style={{fontSize:32,flexShrink:0}}>🏠</span><div style={{flex:1}}><div style={{fontSize:17,fontWeight:800,color:C.orange}}>Room by Room</div><div style={{fontSize:12,color:C.greyText,marginTop:3}}>Kitchen, Bathroom, Bedroom, Living Room</div></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.greyText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button></div></div>);}


const CHALLENGE_30DAY={
  "Week 1 - Quick Wins":{emoji:"⚡",items:["Clear one kitchen drawer","Donate 5 items of clothing","Clear off one countertop","Declutter your purse or bag","Recycle old magazines and papers","Clear out one shelf","Sort through your nightstand"]},
  "Week 2 - Clothing":{emoji:"👕",items:["Donate clothes you haven't worn in a year","Clear out mismatched socks","Declutter workout clothes","Sort through shoes","Clear out accessories you don't use","Donate clothes that don't fit","Sort through outerwear and jackets"]},
  "Week 3 - Kitchen and Living":{emoji:"🍳",items:["Clear out expired pantry items","Donate duplicate kitchen tools","Declutter the junk drawer","Sort through Tupperware and lids","Clear the coffee table","Donate books you won't reread","Declutter the entertainment area"]},
  "Week 4 - Final Push":{emoji:"🏁",items:["Clear out the bathroom cabinet","Donate toiletries you don't use","Declutter under the sink","Sort through the garage or storage","Clear out the car","Donate kids toys or games","Celebrate — you did it!"]}
};

const CHALLENGE_WEEKEND={
  "Saturday Morning":{emoji:"☀️",items:["Clear all flat surfaces in the living room","Sort through one clothes pile","Wipe down kitchen counters and appliances","Empty all bins and replace bags","Vacuum or sweep main living areas"]},
  "Saturday Afternoon":{emoji:"🌤️",items:["Tackle the bathroom — surfaces, toilet, mirror","Sort through any piles of mail or papers","Donate a bag of items you no longer need","Clean out the fridge of expired items","Mop or wipe the kitchen floor"]},
  "Sunday Morning":{emoji:"🌅",items:["Deep clean the bedroom — surfaces and floor","Sort through your wardrobe for donations","Change and wash the bedding","Declutter one drawer or shelf","Wipe down skirting boards and switches"]},
  "Sunday Afternoon":{emoji:"🌞",items:["Tidy entrance and hallway areas","Sort through any bags or backpacks","Clear out the car if needed","Final vacuum of the whole home","Put everything away — you're done!"]}
};

const CHALLENGE_PAPER={
  "Incoming Paper":{emoji:"📬",items:["Sort all mail into keep, shred, recycle","Set up an inbox spot for new paper","Deal with any overdue bills or letters","File or scan important documents","Recycle junk mail immediately"]},
  "Old Documents":{emoji:"🗂️",items:["Shred old bank statements over 7 years","Sort through old receipts","File tax documents properly","Scan and digitise important certificates","Clear out old instruction manuals"]},
  "Books and Magazines":{emoji:"📚",items:["Donate books you won't read again","Recycle old magazines","Keep only your current favourites","Clear bookshelf of knick-knacks","Organise what remains by category"]},
  "Kids Paper":{emoji:"🖍️",items:["Sort through artwork — keep only favourites","Digitise special drawings by photographing them","Clear out old schoolbooks","Sort current school papers","Set up a system for new papers coming in"]}
};

const CHALLENGE_DIGITAL={
  "Email Inbox":{emoji:"📧",items:["Unsubscribe from 10 email lists","Delete emails older than 6 months you don't need","Create folders for important emails","Clear your spam folder","Archive anything worth keeping"]},
  "Photos":{emoji:"📷",items:["Delete duplicate or blurry photos","Organise photos into albums by year","Back up your phone photos","Delete screenshots you no longer need","Clear recently deleted folder"]},
  "Phone and Apps":{emoji:"📱",items:["Delete apps you haven't used in 3 months","Clear app caches","Organise your home screen","Delete old contacts","Clear out your downloads folder"]},
  "Computer and Files":{emoji:"💻",items:["Empty the recycle bin","Delete duplicate files","Organise your desktop","Clear out your downloads","Back up important files to cloud"]}
};

const CHALLENGE_WHOLE_HOME={
  "Entryway and Hallways":{emoji:"🚪",items:["Clear all shoes and coats to proper places","Declutter the console or entrance table","Remove anything that doesn't belong","Wipe walls and light switches","Create a system for keys and bags"]},
  "Kitchen":{emoji:"🍳",items:["Clear all counters completely","Declutter one cupboard fully","Check pantry for expired items","Donate unused appliances","Organise the fridge"]},
  "Living Areas":{emoji:"🛋️",items:["Remove everything from surfaces","Donate books, DVDs or games you don't use","Sort through cushions and throws","Declutter shelves and cabinets","Hoover under furniture"]},
  "Bedrooms":{emoji:"🛏️",items:["Clear bedside tables completely","Sort through wardrobe — 3 bags: keep, donate, bin","Declutter under the bed","Sort through drawers","Change and refresh bedding"]},
  "Bathrooms":{emoji:"🚿",items:["Clear out expired medicines and toiletries","Sort through makeup and skincare","Declutter under the sink","Organise towels and flannels","Wipe all surfaces and mirrors"]}
};

function AllShoppingItemsScreen({onBack}){
  const[list,setList]=useState(()=>initShoppingList());
  const[search,setSearch]=useState("");
  const[regulars,setRegulars]=useState(()=>LS.get("regularItems",[]));
  const[editItem,setEditItem]=useState(null);
  const[editName,setEditName]=useState("");
  const[editStore,setEditStore]=useState(null);
  const[editCat,setEditCat]=useState(null);
  const[editStoreItem,setEditStoreItem]=useState(null);
  const[editStoreName,setEditStoreName]=useState("");
  const[editStoreColor,setEditStoreColor]=useState(C.teal);
  const save=l=>{setList(l);LS.set("shoppingList",l);};
  const saveRegs=r=>{setRegulars(r);LS.set("regularItems",r);};
  const deleteItem=(sid,cid,iid)=>{save({...list,stores:list.stores.map(s=>s.id!==sid?s:{...s,categories:s.categories.map(c=>c.id!==cid?c:{...c,items:c.items.filter(i=>i.id!==iid)})})});};
  const deleteCategory=(sid,cid)=>{save({...list,stores:list.stores.map(s=>s.id!==sid?s:{...s,categories:s.categories.filter(c=>c.id!==cid)})});};
  const deleteStore=sid=>{save({...list,stores:list.stores.filter(s=>s.id!==sid)});};
  const toggleItem=(sid,cid,iid)=>{save({...list,stores:list.stores.map(s=>s.id!==sid?s:{...s,categories:s.categories.map(c=>c.id!==cid?c:{...c,items:c.items.map(i=>i.id!==iid?i:{...i,checked:!i.checked})})})});};
  const toggleRegular=(item,store,cat)=>{
    const isReg=regulars.some(r=>r.name.toLowerCase()===item.name.toLowerCase()&&r.storeId===store.id);
    if(isReg){saveRegs(regulars.filter(r=>!(r.name.toLowerCase()===item.name.toLowerCase()&&r.storeId===store.id)));}
    else{saveRegs([...regulars,{id:"r"+Date.now(),name:item.name,storeId:store.id,storeName:store.name,catId:cat.id,catName:cat.name}]);}
  };
  const openEdit=(item,store,cat)=>{
    setEditItem({iid:item.id,sid:store.id,cid:cat.id});
    setEditName(item.name);setEditStore(store.id);setEditCat(cat.id);
  };
  const saveEdit=()=>{
    const text=editName.trim();if(!text||!editStore||!editCat)return;
    const{iid,sid,cid}=editItem;
    let l=list;
    if(editStore===sid&&editCat===cid){
      l={...l,stores:l.stores.map(s=>s.id!==sid?s:{...s,categories:s.categories.map(c=>c.id!==cid?c:{...c,items:c.items.map(i=>i.id!==iid?i:{...i,name:text})})})};
    } else {
      l={...l,stores:l.stores.map(s=>s.id!==sid?s:{...s,categories:s.categories.map(c=>c.id!==cid?c:{...c,items:c.items.filter(i=>i.id!==iid)})})};
      l={...l,stores:l.stores.map(s=>s.id!==editStore?s:{...s,categories:s.categories.map(c=>c.id!==editCat?c:{...c,items:[...c.items,{id:iid,name:text,checked:false}]})})};
    }
    save(l);setEditItem(null);
  };
  const saveStoreEdit=()=>{
    const text=editStoreName.trim();if(!text)return;
    save({...list,stores:list.stores.map(s=>s.id!==editStoreItem?s:{...s,name:text,color:editStoreColor})});
    setEditStoreItem(null);
  };
  const storeColours=[C.teal,C.blue,"#1A56A8",C.coral,C.orange,C.yellow,"#7B5DD9"];
  const q=search.toLowerCase();

  if(editStoreItem){
    return(
      <div style={{paddingBottom:80}}>
        <Header title="Edit Store" color={C.teal} onBack={()=>setEditStoreItem(null)} fs={22}/>
        <Dots/>
        <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.greyText,letterSpacing:1,marginBottom:10}}>STORE NAME</div>
            <input style={{width:"100%",padding:"14px 16px",border:"2px solid "+C.border,borderRadius:16,fontSize:16,fontFamily:"inherit",color:C.dark,outline:"none",boxSizing:"border-box",background:C.white}}
              placeholder="Store name..." value={editStoreName} onChange={e=>setEditStoreName(e.target.value)} autoFocus/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.greyText,letterSpacing:1,marginBottom:12}}>COLOUR</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {storeColours.map(c=>(
                <div key={c} onClick={()=>setEditStoreColor(c)} style={{width:44,height:44,borderRadius:"50%",background:c,border:editStoreColor===c?"3.5px solid "+C.dark:"3.5px solid transparent",cursor:"pointer",boxShadow:editStoreColor===c?"0 2px 8px rgba(0,0,0,0.2)":"none"}}/>
              ))}
            </div>
          </div>
          <button type="button" onClick={saveStoreEdit} style={{background:C.teal,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  if(editItem){
    const selStore=list.stores.find(s=>s.id===editStore)||null;
    const canSave=editName.trim()&&editStore&&editCat;
    return(
      <div style={{paddingBottom:80}}>
        <Header title="Edit Item" color={C.teal} onBack={()=>setEditItem(null)} fs={22}/>
        <Dots/>
        <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.greyText,letterSpacing:1,marginBottom:10}}>ITEM NAME</div>
            <input style={{width:"100%",padding:"14px 16px",border:"2px solid "+C.border,borderRadius:16,fontSize:16,fontFamily:"inherit",color:C.dark,outline:"none",boxSizing:"border-box",background:C.white}}
              placeholder="Item name..." value={editName} onChange={e=>setEditName(e.target.value)} autoFocus/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.greyText,letterSpacing:1,marginBottom:10}}>STORE</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {list.stores.map(s=>{
                const sel=editStore===s.id;
                return(
                  <button type="button" key={s.id} onClick={()=>{setEditStore(s.id);setEditCat(null);}}
                    style={{padding:"10px 6px",borderRadius:20,border:`2px solid ${sel?s.color:C.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:sel?s.color:C.white,color:sel?C.white:C.dark,textAlign:"center"}}>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
          {selStore&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.greyText,letterSpacing:1,marginBottom:10}}>CATEGORY</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {selStore.categories.map(c=>{
                  const sel=editCat===c.id;
                  return(
                    <button type="button" key={c.id} onClick={()=>setEditCat(c.id)}
                      style={{padding:"10px 6px",borderRadius:20,border:`2px solid ${sel?selStore.color:C.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:sel?selStore.color:C.white,color:sel?C.white:C.dark,textAlign:"center"}}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <button type="button" onClick={saveEdit} disabled={!canSave} style={{background:canSave?C.teal:"#D1D5DB",border:"none",borderRadius:20,padding:"16px",cursor:canSave?"pointer":"default",fontFamily:"inherit",fontSize:16,fontWeight:700,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  const renderStore=store=>{
    const allItems=store.categories.flatMap(cat=>cat.items.map(item=>({...item,catId:cat.id,catName:cat.name,_cat:cat})));
    const filtered=q?allItems.filter(i=>i.name.toLowerCase().includes(q)||i.catName.toLowerCase().includes(q)):allItems;
    if(!filtered.length&&q)return null;
    return(
      <div key={store.id} style={{margin:"0 16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:12,fontWeight:800,color:store.color,letterSpacing:1}}>{store.name.toUpperCase()}</span>
          <div style={{flex:1,height:1.5,background:store.color+"30",borderRadius:2}}/>
          <span style={{fontSize:11,color:C.greyText}}>{allItems.length} item{allItems.length!==1?"s":""}</span>
          <button type="button" onClick={()=>{setEditStoreItem(store.id);setEditStoreName(store.name);setEditStoreColor(store.color);}} style={{width:28,height:28,borderRadius:8,background:C.grey,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:2}}>{Ic.edit()}</button>
          <button type="button" onClick={()=>deleteStore(store.id)} style={{border:"none",background:"none",cursor:"pointer",padding:"2px 4px",flexShrink:0}}>{Ic.trash()}</button>
        </div>
        <div style={{background:C.white,borderRadius:20,boxShadow:"0 2px 8px rgba(0,0,0,0.07)",overflow:"hidden"}}>
          {filtered.length===0&&<div style={{padding:"14px 16px",fontSize:13,color:C.greyText,textAlign:"center"}}>No items yet</div>}
          {filtered.map((item,i)=>{
            const isReg=regulars.some(r=>r.name.toLowerCase()===item.name.toLowerCase()&&r.storeId===store.id);
            return(
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<filtered.length-1?("1px solid "+C.border):"none"}}>
                <div onClick={()=>toggleItem(store.id,item.catId,item.id)} style={{width:22,height:22,borderRadius:6,flexShrink:0,cursor:"pointer",border:"2px solid "+(item.checked?store.color:C.border),background:item.checked?store.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {item.checked&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:C.dark,textDecoration:item.checked?"line-through":"none",opacity:item.checked?0.5:1}}>{item.name}</div>
                  <span style={{fontSize:10,fontWeight:700,color:store.color,background:store.color+"20",padding:"2px 8px",borderRadius:20,display:"inline-block",marginTop:3}}>{item.catName}</span>
                </div>
                <button type="button" onClick={()=>toggleRegular(item,store,item._cat)} style={{border:"none",background:"none",cursor:"pointer",padding:4,flexShrink:0,fontSize:18,lineHeight:1}}>{isReg?"⭐":"☆"}</button>
                <button type="button" onClick={()=>openEdit(item,store,item._cat)} style={{width:28,height:28,borderRadius:8,background:C.grey,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Ic.edit()}</button>
                {!isReg&&<button type="button" onClick={()=>deleteItem(store.id,item.catId,item.id)} style={{border:"none",background:"none",cursor:"pointer",padding:4,flexShrink:0}}>{Ic.trash()}</button>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return(
    <div style={{paddingBottom:80}}>
      <Header title="All Items" color={C.teal} onBack={onBack} fs={24}/>
      <Dots/>
      <div style={{padding:"0 16px 12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,background:C.white,borderRadius:14,padding:"10px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.greyText} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={{flex:1,border:"none",outline:"none",fontSize:14,fontFamily:"inherit",color:C.dark,background:"transparent"}}
            placeholder="Search items..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button type="button" onClick={()=>setSearch("")} style={{border:"none",background:"none",cursor:"pointer",color:C.greyText,fontSize:16,padding:0}}>✕</button>}
        </div>
      </div>
      {list.stores.map(renderStore)}
      {regulars.length>0&&(
        <div style={{margin:"0 16px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:800,color:C.orange,letterSpacing:1}}>⭐ REGULAR ITEMS</span>
            <div style={{flex:1,height:1.5,background:C.orange+"30",borderRadius:2}}/>
            <span style={{fontSize:11,color:C.greyText}}>{regulars.length} saved</span>
          </div>
          <div style={{background:C.white,borderRadius:20,boxShadow:"0 2px 8px rgba(0,0,0,0.07)",overflow:"hidden"}}>
            {regulars.filter(r=>!q||r.name.toLowerCase().includes(q)).map((r,i,arr)=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<arr.length-1?("1px solid "+C.border):"none"}}>
                <span style={{fontSize:18}}>⭐</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:C.dark}}>{r.name}</div>
                  <div style={{fontSize:11,color:C.greyText,marginTop:2}}>{r.storeName} / {r.catName}</div>
                </div>
                <button type="button" onClick={()=>saveRegs(regulars.filter(reg=>reg.id!==r.id))} style={{border:"none",background:"none",cursor:"pointer",padding:4,flexShrink:0}}>{Ic.trash()}</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{padding:"0 16px 8px"}}>
        <button type="button" onClick={onBack} style={{background:C.grey,border:"none",borderRadius:20,padding:"14px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}}>
          <span style={{fontSize:20}}>⚙️</span>
          <span style={{fontSize:15,fontWeight:700,color:C.dark}}>Manage My Shopping</span>
        </button>
      </div>
    </div>
  );
}

function ShoppingListScreen({onBack,setSubScreen}){
  const[list,setList]=useState(()=>initShoppingList());
  const[expandedStore,setExpandedStore]=useState(null);
  const[expandedCat,setExpandedCat]=useState({});
  const[newItem,setNewItem]=useState({});
  const[newCatName,setNewCatName]=useState({});
  const[showAddStore,setShowAddStore]=useState(false);
  const[editingItem,setEditingItem]=useState(null);
  const[regulars,setRegulars]=useState(()=>LS.get("regularItems",[]));
  const[editText,setEditText]=useState("");
  const[newStoreName,setNewStoreName]=useState("");
  const[newStoreColor,setNewStoreColor]=useState(C.teal);
  const[showAddItem,setShowAddItem]=useState(false);
  const[newItemName,setNewItemName]=useState("");
  const[selectedStore,setSelectedStore]=useState(null);
  const[selectedCatId,setSelectedCatId]=useState(null);
  const[saveAsRegular,setSaveAsRegular]=useState(false);
  const[inlineNewStore,setInlineNewStore]=useState(false);
  const[inlineStoreName,setInlineStoreName]=useState("");
  const save=l=>{setList(l);LS.set("shoppingList",l);};
  const storeColors=[C.teal,C.blue,"#1A56A8",C.coral,C.orange,C.yellow,"#7B5DD9"];

  const toggleItem=(sid,cid,iid)=>{save({...list,stores:list.stores.map(s=>s.id!==sid?s:{...s,categories:s.categories.map(c=>c.id!==cid?c:{...c,items:c.items.map(i=>i.id!==iid?i:{...i,checked:!i.checked})})})});};
  const addItem=(sid,cid)=>{
    const key=sid+cid;const text=(newItem[key]||"").trim();if(!text)return;
    save({...list,stores:list.stores.map(s=>s.id!==sid?s:{...s,categories:s.categories.map(c=>c.id!==cid?c:{...c,items:[...c.items,{id:"i"+Date.now(),name:text,checked:false}]})})});
    setNewItem(prev=>({...prev,[key]:""}));
  };
  const clearChecked=sid=>{
    const regs=LS.get("regularItems",[]);
    const isReg=(i,s)=>regs.some(r=>r.name.toLowerCase()===i.name.toLowerCase()&&r.storeId===s);
    save({...list,stores:list.stores.map(s=>s.id!==sid?s:{...s,categories:s.categories.map(c=>({...c,items:c.items.filter(i=>!i.checked||isReg(i,sid)).map(i=>isReg(i,sid)?{...i,checked:false}:i)}))})});
  };
  const addCategory=sid=>{
    const text=(newCatName[sid]||"").trim();if(!text)return;
    save({...list,stores:list.stores.map(s=>s.id!==sid?s:{...s,categories:[...s.categories,{id:"c"+Date.now(),name:text,items:[]}]})});
    setNewCatName(prev=>({...prev,[sid]:""}));
  };
  const addStore=(name,color)=>{
    const text=(name||newStoreName).trim();if(!text)return null;
    const col=color||newStoreColor;
    const newS={id:"s"+Date.now(),name:text,color:col,categories:[{id:"c"+Date.now(),name:"General",items:[]}]};
    const l={...list,stores:[...list.stores,newS]};save(l);
    setNewStoreName("");setNewStoreColor(C.teal);setShowAddStore(false);return newS;
  };
  const addInlineStore=()=>{
    const text=inlineStoreName.trim();if(!text)return;
    const newS={id:"s"+Date.now(),name:text,color:newStoreColor,categories:[{id:"c"+Date.now(),name:"General",items:[]}]};
    const l={...list,stores:[...list.stores,newS]};save(l);
    setSelectedStore(newS.id);setSelectedCatId(newS.categories[0].id);
    setInlineNewStore(false);setInlineStoreName("");setNewStoreColor(C.teal);
  };
  const saveItemEdit=(sid,cid,iid)=>{
    const text=editText.trim();if(!text)return;
    const l={...list,stores:list.stores.map(s=>s.id!==sid?s:{...s,categories:s.categories.map(c=>c.id!==cid?c:{...c,items:c.items.map(i=>i.id!==iid?i:{...i,name:text})})})};
    save(l);setEditingItem(null);setEditText("");
  };
  const addItemDirect=()=>{
    const text=newItemName.trim();if(!text||!selectedStore||!selectedCatId)return;
    const l={...list,stores:list.stores.map(s=>s.id!==selectedStore?s:{...s,categories:s.categories.map(c=>c.id!==selectedCatId?c:{...c,items:[...c.items,{id:"i"+Date.now(),name:text,checked:false}]})})};
    save(l);
    if(saveAsRegular){
      const selStore=list.stores.find(s=>s.id===selectedStore);
      const selCat=selStore&&selStore.categories.find(c=>c.id===selectedCatId);
      if(selStore&&selCat){
        const regs=LS.get("regularItems",[]);
        if(!regs.some(r=>r.name.toLowerCase()===text.toLowerCase()&&r.storeId===selectedStore)){
          LS.set("regularItems",[...regs,{id:"r"+Date.now(),name:text,storeId:selectedStore,storeName:selStore.name,catId:selectedCatId,catName:selCat.name}]);
        }
      }
    }
    if(saveAsRegular){
      setRegulars(LS.get("regularItems",[]));
    }
    setNewItemName("");setSelectedCatId(null);setSaveAsRegular(false);setShowAddItem(false);
  };
  const loadRegulars=()=>{
    const regs=LS.get("regularItems",[]);if(!regs.length)return;
    let l={...list};
    regs.forEach(r=>{
      const store=l.stores.find(s=>s.id===r.storeId);if(!store)return;
      const cat=store.categories.find(c=>c.id===r.catId);if(!cat)return;
      if(!cat.items.some(i=>i.name.toLowerCase()===r.name.toLowerCase()&&!i.checked)){
        l={...l,stores:l.stores.map(s=>s.id!==r.storeId?s:{...s,categories:s.categories.map(c=>c.id!==r.catId?c:{...c,items:[...c.items,{id:"i"+Date.now()+Math.random(),name:r.name,checked:false}]})})};
      }
    });
    save(l);
  };
  const totalItems=list.stores.reduce((a,s)=>a+s.categories.reduce((b,c)=>b+c.items.length,0),0);

  if(showAddItem){
    const selStore=list.stores.find(s=>s.id===selectedStore)||null;
    const canAdd=newItemName.trim()&&selectedStore&&selectedCatId;
    return(
      <div style={{paddingBottom:80}}>
        <Header title="Add Item" color={C.teal} onBack={()=>{setShowAddItem(false);setInlineNewStore(false);setSelectedStore(null);setSelectedCatId(null);}} fs={22}/>
        <Dots/>
        <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.greyText,letterSpacing:1,marginBottom:10}}>ITEM NAME</div>
            <input style={{width:"100%",padding:"14px 16px",border:"2px solid "+C.border,borderRadius:16,fontSize:16,fontFamily:"inherit",color:C.dark,outline:"none",boxSizing:"border-box",background:C.white}}
              placeholder="What do you need to buy?" value={newItemName} onChange={e=>setNewItemName(e.target.value)} autoFocus/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.greyText,letterSpacing:1,marginBottom:10}}>STORE</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {list.stores.map(s=>{
                const sel=selectedStore===s.id;
                return(
                  <button type="button" key={s.id} onClick={()=>{setSelectedStore(s.id);setSelectedCatId(null);}}
                    style={{padding:"10px 6px",borderRadius:20,border:`2px solid ${sel?s.color:C.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:sel?s.color:C.white,color:sel?C.white:C.dark,textAlign:"center"}}>
                    {s.name}
                  </button>
                );
              })}
              {!inlineNewStore&&(
                <button type="button" onClick={()=>setInlineNewStore(true)}
                  style={{padding:"10px 6px",borderRadius:20,border:`2px dashed ${C.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:C.white,color:C.greyText,textAlign:"center"}}>
                  + Add Store
                </button>
              )}
            </div>
            {inlineNewStore&&(
              <div style={{marginTop:10,background:C.grey+"80",borderRadius:16,padding:"14px"}}>
                <input style={{width:"100%",padding:"10px 12px",border:"1.5px solid "+C.border,borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:10}}
                  placeholder="New store name..." value={inlineStoreName} onChange={e=>setInlineStoreName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&addInlineStore()} autoFocus/>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                  {storeColors.map(c=>(
                    <div key={c} onClick={()=>setNewStoreColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:newStoreColor===c?"3px solid "+C.dark:"3px solid transparent",cursor:"pointer",flexShrink:0}}/>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button type="button" onClick={addInlineStore} style={{flex:1,background:C.teal,border:"none",borderRadius:12,padding:"10px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,color:C.white}}>Add Store</button>
                  <button type="button" onClick={()=>{setInlineNewStore(false);setInlineStoreName("");}} style={{background:C.grey,border:"none",borderRadius:12,padding:"10px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,color:C.dark}}>✕</button>
                </div>
              </div>
            )}
          </div>
          {selStore&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.greyText,letterSpacing:1,marginBottom:10}}>CATEGORY</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {selStore.categories.map(c=>{
                  const sel=selectedCatId===c.id;
                  return(
                    <button type="button" key={c.id} onClick={()=>setSelectedCatId(c.id)}
                      style={{padding:"10px 6px",borderRadius:20,border:`2px solid ${sel?selStore.color:C.border}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:sel?selStore.color:C.white,color:sel?C.white:C.dark,textAlign:"center"}}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{background:C.white,borderRadius:20,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)",display:"flex",alignItems:"center",gap:12}}>
            <div onClick={()=>setSaveAsRegular(!saveAsRegular)} style={{width:22,height:22,borderRadius:6,flexShrink:0,cursor:"pointer",border:"2px solid "+(saveAsRegular?C.teal:C.border),background:saveAsRegular?C.teal:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {saveAsRegular&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <div style={{cursor:"pointer"}} onClick={()=>setSaveAsRegular(!saveAsRegular)}>
              <div style={{fontSize:13,fontWeight:700,color:C.dark}}>Save as Regular Item ⭐</div>
              <div style={{fontSize:11,color:C.greyText,marginTop:2}}>Auto-loads with your regular shop</div>
            </div>
          </div>
          <button type="button" onClick={addItemDirect} disabled={!canAdd} style={{background:canAdd?C.teal:"#D1D5DB",border:"none",borderRadius:20,padding:"16px",cursor:canAdd?"pointer":"default",fontFamily:"inherit",fontSize:16,fontWeight:700,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            Add to List
          </button>
        </div>
      </div>
    );
  }


  if(showAddStore)return(
    <div style={{paddingBottom:80}}>
      <Header title="Add Store" color={C.teal} onBack={()=>setShowAddStore(false)} fs={22}/>
      <Dots/>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:C.white,borderRadius:20,padding:"18px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
          <label style={{fontSize:13,fontWeight:700,color:C.dark,display:"block",marginBottom:6}}>Store Name</label>
          <input style={{width:"100%",padding:"11px 12px",border:"1.5px solid "+C.border,borderRadius:12,fontSize:14,fontFamily:"inherit",color:C.dark,outline:"none",boxSizing:"border-box"}}
            placeholder="e.g. Walmart, Target, Costco..." value={newStoreName} onChange={e=>setNewStoreName(e.target.value)} autoFocus/>
        </div>
        <div style={{background:C.white,borderRadius:20,padding:"18px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
          <label style={{fontSize:13,fontWeight:700,color:C.dark,display:"block",marginBottom:10}}>Colour</label>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {storeColors.map(c=>(
              <button type="button" key={c} onClick={()=>setNewStoreColor(c)} style={{width:40,height:40,borderRadius:"50%",background:c,border:newStoreColor===c?"3px solid "+C.dark:"3px solid transparent",cursor:"pointer",flexShrink:0}}/>
            ))}
          </div>
        </div>
        <button type="button" onClick={()=>addStore()} style={{background:C.teal,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          Add Store
        </button>
      </div>
    </div>
  );

  return(
    <div style={{paddingBottom:80}}>
      <Header title="Shopping List" color={C.teal} onBack={onBack} fs={24}/>
      <Dots/>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:10}}>

        {list.stores.length===0&&<div style={{background:C.white,borderRadius:20,padding:"40px 20px",textAlign:"center",color:C.greyText,fontSize:14,boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
          <div style={{fontSize:40,marginBottom:12}}>🛒</div>
          <div style={{fontWeight:700,color:C.dark,marginBottom:4}}>No stores yet!</div>
          <div>Tap Add Store below to get started.</div>
        </div>}
        {list.stores.map(store=>{
          const totalSt=store.categories.reduce((a,c)=>a+c.items.length,0);
          const checkedSt=store.categories.reduce((a,c)=>a+c.items.filter(i=>i.checked).length,0);
          const isOpen=expandedStore===store.id;
          return(
            <div key={store.id} style={{background:C.white,borderRadius:20,boxShadow:"0 2px 8px rgba(0,0,0,0.07)",overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",padding:"14px 16px",background:store.color+"18",borderBottom:isOpen?("1px solid "+store.color+"30"):"none"}}>
                <button type="button" onClick={()=>setExpandedStore(isOpen?null:store.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>🛒</span>
                  <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:store.color}}>{store.name}</div><div style={{fontSize:11,color:C.greyText,marginTop:1}}>{checkedSt}/{totalSt} items</div></div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.greyText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {isOpen&&checkedSt>0&&<button type="button" onClick={()=>clearChecked(store.id)} style={{border:"none",background:store.color,borderRadius:10,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,color:C.white,marginLeft:8}}>Clear done</button>}
              </div>
              {isOpen&&(
                <div>
                  {store.categories.map(cat=>cat.items.map(item=>(
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid "+C.border,background:C.white}}>
                      <div onClick={()=>{const l={...list,stores:list.stores.map(s=>s.id!==store.id?s:{...s,categories:s.categories.map(c=>c.id!==cat.id?c:{...c,items:c.items.map(i=>i.id!==item.id?i:{...i,checked:!i.checked})})})};save(l);}} style={{width:24,height:24,borderRadius:6,flexShrink:0,cursor:"pointer",border:"2px solid "+(item.checked?store.color:C.border),background:item.checked?store.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {item.checked&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.dark,textDecoration:item.checked?"line-through":"none",opacity:item.checked?0.5:1}}>{item.name}</div>
                        <div style={{marginTop:3}}>
                          <span style={{fontSize:10,fontWeight:700,color:store.color,background:store.color+"20",padding:"2px 8px",borderRadius:20,display:"inline-block"}}>{cat.name}</span>
                        </div>
                      </div>
                      {(()=>{const isReg=regulars.some(r=>r.name.toLowerCase()===item.name.toLowerCase()&&r.storeId===store.id);return(<span style={{fontSize:18,flexShrink:0,opacity:isReg?1:0.25}}>{isReg?"⭐":"☆"}</span>);})()}
                      <button type="button" onClick={()=>setSubScreen("shoppingListAll")} style={{width:28,height:28,borderRadius:8,background:C.grey,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Ic.edit()}</button>
                    </div>
                  )))}
                  {store.categories.length>0&&(
                    <div style={{display:"flex",gap:8,padding:"10px 16px"}}>
                      <input style={{flex:1,padding:"8px 12px",border:"1px solid "+C.border,borderRadius:12,fontSize:13,fontFamily:"inherit",color:C.dark,background:C.white,outline:"none"}}
                        placeholder="Quick add to General..."
                        value={newItem[store.id+(store.categories[0]&&store.categories[0].id)]||""}
                        onChange={e=>setNewItem(prev=>({...prev,[store.id+(store.categories[0]&&store.categories[0].id)]:e.target.value}))}
                        onKeyDown={e=>e.key==="Enter"&&store.categories[0]&&addItem(store.id,store.categories[0].id)}/>
                      <button type="button" onClick={()=>store.categories[0]&&addItem(store.id,store.categories[0].id)} style={{background:store.color,border:"none",borderRadius:12,padding:"8px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:C.white}}>Add</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {totalItems>0&&<button type="button" onClick={()=>setSubScreen("shoppingListAll")} style={{width:"100%",background:"none",border:"none",borderTop:"none",padding:"4px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,color:C.teal,fontSize:13,fontWeight:700}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          View All Items
        </button>}
        <button type="button" onClick={()=>setShowAddItem(true)} style={{background:C.teal,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
          Add Item
        </button>

      </div>
    </div>
  );
}

function TodoListScreen({onBack,setTab,todos:todosProp,setTodos:setTodosProp}){
  const[localTodos,setLocalTodos]=useState(()=>initTodoList());
  const todos=todosProp||localTodos;
  const setTodos=todosProp?setTodosProp:setLocalTodos;
  const[showAdd,setShowAdd]=useState(false);
  const[newText,setNewText]=useState("");
  const[newDate,setNewDate]=useState("");
  const[newNotes,setNewNotes]=useState("");
  const[expandedId,setExpandedId]=useState(null);
  const today=new Date().toISOString().split("T")[0];
  const save=t=>{setTodos(t);LS.set("todoList",t);};
  const addTodo=()=>{
    const text=newText.trim();if(!text)return;
    const t=[...todos,{id:"t"+Date.now(),text,dueDate:newDate||null,notes:newNotes.trim()||null,completed:false}];
    save(t);setNewText("");setNewDate("");setNewNotes("");setShowAdd(false);
  };
  const toggle=id=>{save(todos.map(t=>t.id===id?{...t,completed:!t.completed}:t));};
  const deleteTodo=id=>{save(todos.filter(t=>t.id!==id));if(expandedId===id)setExpandedId(null);};
  const moveUp=id=>{const idx=todos.findIndex(t=>t.id===id);if(idx<=0)return;const t=[...todos];[t[idx-1],t[idx]]=[t[idx],t[idx-1]];save(t);};
  const moveDown=id=>{const idx=todos.findIndex(t=>t.id===id);if(idx>=todos.length-1)return;const t=[...todos];[t[idx],t[idx+1]]=[t[idx+1],t[idx]];save(t);};
  const dueBadge=(dueDate)=>{
    if(!dueDate)return null;
    const diff=Math.ceil((new Date(dueDate)-new Date(today))/86400000);
    const bg=diff<0?"#FDEEF1":diff===0?"#FFF3E0":diff<=2?"#FFFBE0":"#F3F4F6";
    const col=diff<0?C.coral:diff===0?C.orange:diff<=2?"#B8860B":C.greyText;
    const label=diff<0?Math.abs(diff)+"d overdue":diff===0?"Today":diff===1?"Tomorrow":new Date(dueDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
    return <span style={{fontSize:10,fontWeight:700,color:col,background:bg,padding:"2px 7px",borderRadius:20,flexShrink:0}}>{label}</span>;
  };
  const active=todos.filter(t=>!t.completed);
  const done=todos.filter(t=>t.completed);

  if(showAdd)return(
    <div style={{paddingBottom:80}}>
      <Header title="Add Task" color={C.blue} onBack={()=>setShowAdd(false)} fs={22}/>
      <Dots/>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:C.white,borderRadius:20,padding:"18px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
          <label style={{fontSize:13,fontWeight:700,color:C.dark,display:"block",marginBottom:6}}>Task</label>
          <input style={{width:"100%",padding:"11px 12px",border:"1.5px solid "+C.border,borderRadius:12,fontSize:14,fontFamily:"inherit",color:C.dark,outline:"none",boxSizing:"border-box"}}
            placeholder="What do you need to do?" value={newText} onChange={e=>setNewText(e.target.value)} autoFocus/>
        </div>
        <div style={{background:C.white,borderRadius:20,padding:"18px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
          <label style={{fontSize:13,fontWeight:700,color:C.dark,display:"block",marginBottom:6}}>Due Date <span style={{color:C.greyText,fontWeight:400}}>(optional)</span></label>
          <input type="date" style={{width:"100%",padding:"11px 12px",border:"1.5px solid "+C.border,borderRadius:12,fontSize:14,fontFamily:"inherit",color:C.dark,outline:"none",boxSizing:"border-box"}}
            value={newDate} onChange={e=>setNewDate(e.target.value)} min={today}/>
        </div>
        <div style={{background:C.white,borderRadius:20,padding:"18px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
          <label style={{fontSize:13,fontWeight:700,color:C.dark,display:"block",marginBottom:6}}>Notes <span style={{color:C.greyText,fontWeight:400}}>(optional)</span></label>
          <textarea style={{width:"100%",padding:"11px 12px",border:"1.5px solid "+C.border,borderRadius:12,fontSize:14,fontFamily:"inherit",color:C.dark,outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:100,lineHeight:1.5}}
            placeholder="Add any extra details, links or reminders..." value={newNotes} onChange={e=>setNewNotes(e.target.value)}/>
        </div>
        <button type="button" onClick={addTodo} style={{background:C.blue,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          Add Task
        </button>
      </div>
    </div>
  );

  return(
    <div style={{paddingBottom:80}}>
      <Header title="To-Do List" color={C.blue} onBack={onBack} fs={24}/>
      <Dots/>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:10}}>
        {active.length===0&&done.length===0&&(
          <div style={{background:C.white,borderRadius:20,padding:"40px 20px",textAlign:"center",color:C.greyText,fontSize:14,boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontWeight:700,color:C.dark,marginBottom:4}}>No tasks yet!</div>
            <div>Tap the button below to add your first to-do.</div>
          </div>
        )}
        {active.length>0&&(
          <div style={{background:C.white,borderRadius:20,boxShadow:"0 2px 8px rgba(0,0,0,0.07)",overflow:"hidden"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.blue,letterSpacing:1,padding:"12px 16px 8px"}}>TO DO ({active.length})</div>
            {active.map((todo,i)=>(
              <div key={todo.id} style={{borderBottom:i<active.length-1?"1px solid "+C.border:"none"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px"}}>
                  <div onClick={()=>toggle(todo.id)} style={{width:22,height:22,borderRadius:6,flexShrink:0,cursor:"pointer",border:"2px solid "+C.blue,background:"transparent",marginTop:1}}/>
                  <div style={{flex:1,cursor:"pointer",minWidth:0}} onClick={()=>setExpandedId(expandedId===todo.id?null:todo.id)}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:600,color:C.dark}}>{todo.text}</span>
                      {dueBadge(todo.dueDate)}
                    </div>
                    {todo.notes&&expandedId!==todo.id&&(
                      <div style={{fontSize:12,color:C.greyText,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{todo.notes}</div>
                    )}
                    {expandedId===todo.id&&todo.notes&&(
                      <div style={{fontSize:13,color:C.greyText,marginTop:6,lineHeight:1.6,background:"#F9FAFB",borderRadius:8,padding:"8px 10px"}}>{todo.notes}</div>
                    )}
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0,marginTop:1}}>
                    <button type="button" onClick={()=>moveUp(todo.id)} style={{width:26,height:26,borderRadius:6,background:C.grey,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.greyText} strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button type="button" onClick={()=>moveDown(todo.id)} style={{width:26,height:26,borderRadius:6,background:C.grey,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.greyText} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button type="button" onClick={()=>deleteTodo(todo.id)} style={{width:26,height:26,borderRadius:6,background:C.grey,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ic.trash()}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {done.length>0&&(
          <div style={{background:C.white,borderRadius:20,boxShadow:"0 2px 8px rgba(0,0,0,0.07)",overflow:"hidden"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 8px"}}>
              <span style={{fontSize:10,fontWeight:700,color:C.greyText,letterSpacing:1}}>COMPLETED ({done.length})</span>
              <button type="button" onClick={()=>save(todos.filter(t=>!t.completed))} style={{border:"none",background:"none",cursor:"pointer",fontSize:11,fontWeight:700,color:C.coral,fontFamily:"inherit"}}>Clear all</button>
            </div>
            {done.map((todo,i)=>(
              <div key={todo.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:i<done.length-1?"1px solid "+C.border:"none",opacity:0.5}}>
                <div onClick={()=>toggle(todo.id)} style={{width:22,height:22,borderRadius:6,flexShrink:0,cursor:"pointer",border:"2px solid "+C.teal,background:C.teal,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{flex:1,fontSize:13,color:C.dark,textDecoration:"line-through"}}>{todo.text}</span>
                <button type="button" onClick={()=>deleteTodo(todo.id)} style={{width:24,height:24,borderRadius:6,background:C.grey,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ic.trash()}</button>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={()=>setShowAdd(true)} style={{background:C.blue,border:"none",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          Add a Task
        </button>
      </div>
    </div>
  );
}
function ADHDPlaceholder({title,emoji,color,bg,onBack}){
  return(
    <div style={{paddingBottom:80}}>
      <Header title={title} color={color} onBack={onBack} fs={22}/>
      <Dots/>
      <div style={{padding:"40px 24px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:16}}>
        <div style={{fontSize:80}}>{emoji}</div>
        <div style={{fontSize:22,fontWeight:900,color:color}}>{title}</div>
        <div style={{background:bg,borderRadius:20,padding:"20px 24px",border:"1.5px solid "+color+"40",maxWidth:340}}>
          <div style={{fontSize:15,color:C.dark,fontWeight:700,marginBottom:8}}>Coming Soon</div>
          <div style={{fontSize:13,color:C.greyText,lineHeight:1.6}}>This page is being designed with helpful tools and strategies specifically for you. Check back soon!</div>
        </div>
      </div>
    </div>
  );
}

function MoreTab({setSubScreen}){
  const SectionHeader=({title,color})=>(
    <div style={{display:"flex",alignItems:"center",gap:10,margin:"4px 0 10px"}}>
      <span style={{fontSize:12,fontWeight:800,color:color||C.dark,letterSpacing:1}}>{title}</span>
      <div style={{flex:1,height:1.5,background:color?color+"30":C.border,borderRadius:2}}/>
    </div>
  );
  const Btn=({emoji,label,sub,bg,border,color,subtitle})=>(
    <button type="button" onClick={()=>setSubScreen(sub)} style={{background:bg,border:"2px solid "+border,borderRadius:20,padding:"16px 14px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6,textAlign:"center",flex:1,minWidth:0}}>
      <span style={{fontSize:28}}>{emoji}</span>
      <div style={{fontSize:13,fontWeight:700,color:color,lineHeight:1.2}}>{label}</div>
      {subtitle&&<div style={{fontSize:10,color:C.greyText,lineHeight:1.3}}>{subtitle}</div>}
    </button>
  );
  return(
    <div style={{paddingBottom:80}}>
      <div style={{padding:"20px 20px 8px",textAlign:"center"}}>
        <h2 style={{margin:"0 0 2px",fontSize:28,fontWeight:900,letterSpacing:1,color:C.blue}}>EXPLORE</h2>
      </div>
      <Dots/>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:4}}>

        <SectionHeader title="MY LISTS" color={C.blue}/>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <Btn emoji="🛒" label="Shopping List" sub="shoppingList" bg="#E8F7F2" border="#A8D9C8" color={C.teal} subtitle="By store and category"/>
          <Btn emoji="✅" label="To-Do List" sub="todoList" bg="#EEF6FF" border="#C8DCFF" color={C.blue} subtitle="With due dates"/>
        </div>

        <SectionHeader title="CHECKLISTS" color={C.orange}/>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <Btn emoji="🧹" label="Deep Clean" sub="deepClean" bg="#FEF3E2" border="#F0C888" color={C.orange}/>
          <Btn emoji="📦" label="Declutter" sub="declutter" bg="#FDEEF1" border="#F0A8B8" color={C.coral}/>
          <Btn emoji="⚡" label="Speed Clean" sub="speedClean" bg="#E8F7F2" border="#A8D9C8" color={C.teal}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <Btn emoji="🗓️" label="Quarterly" sub="quarterly" bg="#FFF8F0" border="#FFD599" color={C.orange}/>
          <Btn emoji="🌿" label="Seasonal" sub="seasonal" bg="#EEF6FF" border="#C8DCFF" color={C.blue}/>
          <Btn emoji="📅" label="Yearly" sub="yearly" bg="#F5F0FF" border="#C8B4FF" color="#7B5DD9"/>
        </div>

        <SectionHeader title="DECLUTTERING CHALLENGES" color="#7B5DD9"/>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <Btn emoji="🏆" label="30-Day Challenge" sub="challenge30" bg="#F5F0FF" border="#C8B4FF" color="#7B5DD9" subtitle="One task a day"/>
          <Btn emoji="⚔️" label="Weekend Warrior" sub="challengeWeekend" bg="#FEF3E2" border="#F0C888" color={C.orange} subtitle="Tackle it all"/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <Btn emoji="📄" label="Paper Chase" sub="challengePaper" bg="#EEF6FF" border="#C8DCFF" color={C.blue} subtitle="Tackle paper clutter"/>
          <Btn emoji="💻" label="Digital Life" sub="challengeDigital" bg="#E8F7F2" border="#A8D9C8" color={C.teal} subtitle="Clear digital clutter"/>
          <Btn emoji="🏠" label="Whole Home" sub="challengeWholeHome" bg="#FDEEF1" border="#F0A8B8" color={C.coral} subtitle="Full reset"/>
        </div>

        <SectionHeader title="ADHD SUPPORT" color={C.teal}/>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <Btn emoji="😰" label="I Feel Overwhelmed" sub="adhd_overwhelmed" bg="#EEF6FF" border="#C8DCFF" color={C.blue}/>
          <Btn emoji="🔋" label="Low Energy Mode" sub="adhd_lowenergy" bg="#FFFBE0" border="#F0D060" color={C.orange}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <Btn emoji="🪨" label="Can't Get Started" sub="adhd_cantstart" bg="#E8F7F2" border="#A8D9C8" color={C.teal}/>
          <Btn emoji="🔄" label="Help Me Reset" sub="adhd_reset" bg="#FDEEF1" border="#F0A8B8" color={C.coral}/>
        </div>

        <button type="button" onClick={()=>setSubScreen("settings")} style={{background:C.grey,border:"none",borderRadius:16,padding:"14px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}}>
          <span style={{fontSize:20}}>⚙️</span>
          <span style={{fontSize:15,fontWeight:700,color:C.dark}}>Settings</span>
        </button>

      </div>
    </div>
  );
}

function SettingsScreen({tasks,setTasks,timeChores,randomChores,completedChores,setCompletedChores,onBack}){
  const reset=()=>{
    if(confirm("This will delete all your tasks and reset everything to starter data. Are you sure?")){
      ["tasks","timeChores","randomChores","completedChores","dataVersion","lastResetDate","lastWeekReset","lastMonthReset","deepClean","declutter","seasonal","yearly","quarterly","speedCleanTime","speedCleanRoom","completedDates"].forEach(k=>LS.clear(k));
      LS.set("completedChores",[]);window.location.reload();
    }
  };
  const resetProgress=()=>{
    if(confirm("Reset streak, checklists and counts? Your tasks will be kept.")){
      const cleared=tasks.map(t=>({...t,completed:false}));
      LS.set("tasks",cleared);
      LS.set("completedChores",[]);
      LS.set("completedDates",[]);
      ["deepClean","declutter","seasonal","yearly","quarterly","speedCleanTime","speedCleanRoom"].forEach(k=>{
        const ex=LS.get(k,null);
        if(ex&&typeof ex==="object"&&!Array.isArray(ex)){
          const r={};
          Object.keys(ex).forEach(s=>{r[s]={...ex[s],checked:Array.isArray(ex[s]&&ex[s].checked)?ex[s].checked.map(()=>false):[]};});
          LS.set(k,r);
        }
      });
      LS.clear("lastResetDate");LS.clear("lastWeekReset");LS.clear("lastMonthReset");
      window.location.reload();
    }
  };
  const rows=[{label:"Total Tasks",value:tasks.length},{label:"Completed Today",value:tasks.filter(t=>t.completed&&t.day==="Today").length},{label:"Quick Tasks (I Have Time)",value:timeChores.length},{label:"Random Chore Library",value:randomChores.length},{label:"Random Chores Done",value:completedChores.length}];
  const[notifEnabled,setNotifEnabled]=useState(()=>LS.get("notifEnabled",false));
  const[notifTime,setNotifTime]=useState(()=>LS.get("notifTime","08:00"));
  const[permStatus,setPermStatus]=useState(()=>typeof Notification!=="undefined"?Notification.permission:"unsupported");
  const requestPermission=async()=>{if(typeof Notification==="undefined"){setPermStatus("unsupported");return;}const result=await Notification.requestPermission();setPermStatus(result);if(result==="granted"){setNotifEnabled(true);LS.set("notifEnabled",true);}};
  const toggleNotif=async()=>{if(!notifEnabled){if(permStatus==="granted"){setNotifEnabled(true);LS.set("notifEnabled",true);}else await requestPermission();}else{setNotifEnabled(false);LS.set("notifEnabled",false);}};
  const handleTimeChange=t=>{setNotifTime(t);LS.set("notifTime",t);};
  const showNotif=(title,body)=>{
    if(typeof Notification==="undefined"||Notification.permission!=="granted")return;
    if("serviceWorker" in navigator){
      navigator.serviceWorker.ready.then(reg=>{
        reg.showNotification(title,{body,icon:"/icon.png",badge:"/icon.png"});
      }).catch(()=>{try{new Notification(title,{body,icon:"/icon.png"});}catch(e){}});
    } else {
      try{new Notification(title,{body,icon:"/icon.png"});}catch(e){}
    }
  };
  const testNotif=()=>{
    if(permStatus!=="granted")return;
    const incomplete=tasks.filter(t=>t.day==="Today"&&!t.completed);
    showNotif("🧹 ADHD Cleaning Checklist",incomplete.length>0?`You have ${incomplete.length} task${incomplete.length!==1?"s":""} left today. Let's get cleaning!`:"All tasks done today — amazing work! 🎉");
  };
  return(
    <div style={{paddingBottom:80}}>
      <Header title="Settings" color={C.blue} onBack={onBack}/><Dots/>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:C.white,borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:14}}>🔔 Daily Reminder</div>
          {permStatus==="unsupported"&&<div style={{background:"#FEF3E2",borderRadius:12,padding:"12px 14px",fontSize:13,color:C.dark,marginBottom:12}}>Notifications aren't supported in this browser. For best results, add the app to your home screen as a PWA.</div>}
          {permStatus==="denied"&&<div style={{background:"#FDEEF1",borderRadius:12,padding:"12px 14px",fontSize:13,color:C.coral,marginBottom:12}}>Notifications are blocked. Please enable them in your browser/phone settings for this site, then come back here.</div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:notifEnabled?16:0}}>
            <div><div style={{fontSize:14,fontWeight:600,color:C.dark}}>Daily task reminder</div><div style={{fontSize:12,color:C.greyText,marginTop:2}}>Reminds you to check your tasks</div></div>
            <div onClick={permStatus!=="denied"&&permStatus!=="unsupported"?toggleNotif:undefined} style={{width:48,height:26,borderRadius:13,background:notifEnabled?C.teal:C.border,cursor:permStatus==="denied"||permStatus==="unsupported"?"default":"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{position:"absolute",top:3,left:notifEnabled?24:3,width:20,height:20,borderRadius:"50%",background:C.white,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/></div>
          </div>
          {notifEnabled&&(<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontSize:14,fontWeight:600,color:C.dark}}>Reminder time</div><div style={{fontSize:12,color:C.greyText,marginTop:2}}>When should we remind you?</div></div>
              <input type="time" value={notifTime} onChange={e=>handleTimeChange(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.teal}`,fontSize:14,fontWeight:700,color:C.teal,fontFamily:"inherit",background:C.white,outline:"none",cursor:"pointer"}}/>
            </div>
            <button type="button" onClick={testNotif} style={{background:"#E8F7F2",border:"none",borderRadius:12,padding:"11px",fontSize:13,fontWeight:700,color:C.teal,cursor:"pointer",fontFamily:"inherit"}}>Send a Test Notification</button>
            <div style={{background:C.grey,borderRadius:12,padding:"12px 14px",fontSize:12,color:C.greyText,lineHeight:1.5}}>💡 Keep the app open or added to your home screen for reminders to fire reliably.</div>
          </div>)}
          {permStatus==="default"&&!notifEnabled&&<button type="button" onClick={requestPermission} style={{width:"100%",marginTop:4,background:C.teal,color:C.white,border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Enable Notifications</button>}
        </div>
        <div style={{background:C.white,borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:12}}>App Stats</div>
          {rows.map((r,i)=>(<div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<rows.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:14,color:C.dark}}>{r.label}</span><span style={{fontSize:14,fontWeight:700,color:C.dark}}>{r.value}</span></div>))}
        </div>
        <div style={{background:C.white,borderRadius:20,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:4}}>About</div>
          <div style={{fontSize:13,color:C.greyText,marginBottom:14}}>Weekly Cleaning Checklist v1.0</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button type="button" onClick={resetProgress} style={{width:"100%",background:"#FEF3E2",color:C.orange,border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Reset Progress Only</button>
            <div style={{fontSize:11,color:C.greyText,textAlign:"center",marginTop:-4,marginBottom:4}}>Keeps your tasks — resets streak, checklists and counts</div>
            <button type="button" onClick={reset} style={{width:"100%",background:C.grey,color:C.coral,border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Factory Reset</button>
            <div style={{fontSize:11,color:C.greyText,textAlign:"center",marginTop:-4}}>Deletes everything and restores starter data</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SplashScreen(){
  const[rot,setRot]=useState(0);
  useEffect(()=>{
    const id=setInterval(()=>setRot(r=>(r+0.08)%360),16);
    return()=>clearInterval(id);
  },[]);
  const rings=[
    {size:380,color:"#F39A3D",speed:1,dir:1},
    {size:300,color:"#4CAF8A",speed:1.33,dir:-1},
    {size:220,color:"#E85B6A",speed:1.71,dir:1},
    {size:140,color:"#8ECAD0",speed:2.4,dir:-1},
  ];
  return(
    <div style={{background:"#ffffff",minHeight:"100vh",maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Nunito','Poppins',system-ui,sans-serif",gap:20,position:"relative",overflow:"hidden"}}>
      {rings.map((r,i)=>(
        <div key={i} style={{position:"absolute",width:r.size,height:r.size,borderRadius:"50%",border:`3px dashed ${r.color}50`,top:"50%",left:"50%",marginTop:-r.size/2,marginLeft:-r.size/2,transform:`rotate(${rot*r.speed*r.dir}deg)`,willChange:"transform"}}/>
      ))}
      <img src="/icon.png" alt="" style={{width:150,height:150,objectFit:"contain",border:"none",background:"transparent",position:"relative",zIndex:2}} onError={e=>e.target.style.display="none"}/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,position:"relative",zIndex:2}}>
        <div style={{fontSize:32,fontWeight:900,letterSpacing:2,display:"flex",gap:1,flexWrap:"wrap",justifyContent:"center"}}>{["ADHD","CLEANING"].map((word,wi)=>(
          <span key={wi} style={{display:"flex",gap:1,marginRight:wi===0?10:0}}>
            {word.split("").map((ch,ci)=><span key={ci} style={{color:DC[(wi*4+ci)%DC.length]}}>{ch}</span>)}
          </span>
        ))}</div>
        <div style={{fontSize:32,fontWeight:900,color:"#1F2937",letterSpacing:2}}>CHECKLIST</div>
        <div style={{display:"flex",gap:14,marginTop:10}}>{DC.map((c,i)=><div key={i} style={{width:12,height:12,borderRadius:"50%",background:c}}/>)}</div>
      </div>
    </div>
  );
}

export default function App(){
  const[splash,setSplash]=useState(true);
  useEffect(()=>{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js").catch(()=>{});
    }
  },[]);
  useEffect(()=>{const t=setTimeout(()=>setSplash(false),2800);return()=>clearTimeout(t);},[]);
  const[tab,setTab]=useState("home");const[sub,setSub]=useState(null);const[editId,setEditId]=useState(null);
  const[tasks,setTasks]=useState(()=>initTasks());const[timeChores,setTimeChores]=useState(()=>initTimeChores());const[randomChores,setRandomChores]=useState(()=>initRandomChores());const[completedChores,setCompletedChores]=useState(()=>initCompletedChores());
  const[todos,setTodos]=useState(()=>initTodoList());
  const goTab=useCallback(t=>{setTab(t);setSub(null);},[]);const back=screen=>()=>setSub(screen||null);
  useEffect(()=>{
    const schedule=()=>{
      const enabled=LS.get("notifEnabled",false);const time=LS.get("notifTime","08:00");
      if(!enabled||typeof Notification==="undefined"||Notification.permission!=="granted")return;
      const[h,m]=time.split(":").map(Number);const now=new Date();const target=new Date();
      target.setHours(h,m,0,0);if(target<=now)target.setDate(target.getDate()+1);
      const tid=setTimeout(()=>{
        const incomplete=tasks.filter(t=>t.day==="Today"&&!t.completed);
        if("serviceWorker" in navigator){navigator.serviceWorker.ready.then(reg=>{reg.showNotification("🧹 ADHD Cleaning Checklist",{body:incomplete.length>0?`You have ${incomplete.length} task${incomplete.length!==1?"s":""} left today. Let's get cleaning!`:"All tasks done today — amazing work! 🎉",icon:"/icon.png"});}).catch(()=>{});} else {try{new Notification("🧹 ADHD Cleaning Checklist",{body:incomplete.length>0?`You have ${incomplete.length} task${incomplete.length!==1?"s":""} left today. Let's get cleaning!`:"All tasks done today — amazing work! 🎉",icon:"/icon.png"});}catch(e){}}
        schedule();
      },target-now);
      return()=>clearTimeout(tid);
    };
    schedule();
  },[]);
  const render=()=>{
    if(sub==="addTask")         return <AddTaskScreen tasks={tasks} setTasks={setTasks} onBack={back()}/>;
    if(sub==="editTask")        return <EditTaskScreen tasks={tasks} setTasks={setTasks} taskId={editId} onBack={back()}/>;
    if(sub==="haveTime")        return <HaveTimeScreen timeChores={timeChores} setTimeChores={setTimeChores} setSubScreen={setSub} onBack={back()}/>;
    if(sub==="myTimeChores")    return <MyTimeChoresScreen timeChores={timeChores} setTimeChores={setTimeChores} setSubScreen={setSub} onBack={back("haveTime")}/>;
    if(sub==="addTimeChore")    return <AddTimeChoreScreen timeChores={timeChores} setTimeChores={setTimeChores} onBack={back("myTimeChores")}/>;
    if(sub==="randomChore")     return <RandomChoreScreen randomChores={randomChores} completedChores={completedChores} setCompletedChores={setCompletedChores} onBack={back()}/>;
    if(sub==="myRandomChores")  return <MyRandomChoresScreen randomChores={randomChores} setRandomChores={setRandomChores} setSubScreen={setSub} onBack={back()}/>;
    if(sub==="addRandomChore")  return <AddRandomChoreScreen randomChores={randomChores} setRandomChores={setRandomChores} onBack={back("myRandomChores")}/>;
    if(sub==="completedChores") return <CompletedRandomChoresScreen completedChores={completedChores} onBack={back()}/>;
    if(sub==="speedClean")      return <SpeedCleanTab setSubScreen={setSub} onBack={back("more")}/>;
    if(sub==="speedCleanTime")  return <ChecklistScreen title="By Time" color={C.teal} data={SPEED_CLEAN_TIME_DATA} storageKey="speedCleanTime" onBack={back("speedClean")}/>;
    if(sub==="speedCleanRoom")  return <ChecklistScreen title="Room by Room" color={C.orange} data={SPEED_CLEAN_ROOM_DATA} storageKey="speedCleanRoom" onBack={back("speedClean")}/>;
    if(sub==="quarterly")       return <ChecklistScreen title="Quarterly" color="#E07820" data={QUARTERLY_DATA} storageKey="quarterly" onBack={back("more")}/>;
    if(sub==="deepClean")       return <ChecklistScreen title="Deep Clean" color={C.orange} data={DEEP_CLEAN_DATA} storageKey="deepClean" onBack={back("more")}/>;
    if(sub==="declutter")       return <ChecklistScreen title="Declutter" color={C.coral} data={DECLUTTER_DATA} storageKey="declutter" onBack={back("more")}/>;
    if(sub==="seasonal")        return <ChecklistScreen title="Seasonal" color={C.teal} data={SEASONAL_DATA} storageKey="seasonal" onBack={back("more")}/>;
    if(sub==="yearly")          return <ChecklistScreen title="Yearly Schedule" color={C.orange} data={YEARLY_DATA} storageKey="yearly" onBack={back("more")}/>;
    if(sub==="settings")        return <SettingsScreen tasks={tasks} setTasks={setTasks} timeChores={timeChores} randomChores={randomChores} completedChores={completedChores} setCompletedChores={setCompletedChores} onBack={back(tab==="more"?"more":null)}/>;
    if(sub==="challenge30")      return <ChecklistScreen title="30-Day Challenge" color="#7B5DD9" data={CHALLENGE_30DAY} storageKey="challenge30" onBack={back("more")}/>;
    if(sub==="challengeWeekend") return <ChecklistScreen title="Weekend Warrior" color={C.orange} data={CHALLENGE_WEEKEND} storageKey="challengeWeekend" onBack={back("more")}/>;
    if(sub==="challengePaper")   return <ChecklistScreen title="Paper Chase" color={C.blue} data={CHALLENGE_PAPER} storageKey="challengePaper" onBack={back("more")}/>;
    if(sub==="challengeDigital") return <ChecklistScreen title="Digital Life" color={C.teal} data={CHALLENGE_DIGITAL} storageKey="challengeDigital" onBack={back("more")}/>;
    if(sub==="challengeWholeHome") return <ChecklistScreen title="Whole Home Reset" color={C.coral} data={CHALLENGE_WHOLE_HOME} storageKey="challengeWholeHome" onBack={back("more")}/>;
    if(sub==="shoppingList")    return <ShoppingListScreen onBack={back("more")} setSubScreen={setSub}/>;
    if(sub==="shoppingListAll") return <AllShoppingItemsScreen onBack={back("shoppingList")}/>;
    if(sub==="todoList")        return <TodoListScreen onBack={back("more")} setTab={goTab} todos={todos} setTodos={setTodos}/>;
    if(sub==="adhd_overwhelmed") return <ADHDPlaceholder title="I Feel Overwhelmed" emoji="😰" color={C.blue} bg="#EEF6FF" onBack={back("more")}/>;
    if(sub==="adhd_lowenergy")   return <ADHDPlaceholder title="Low Energy Mode" emoji="🔋" color={C.orange} bg="#FFFBE0" onBack={back("more")}/>;
    if(sub==="adhd_cantstart")   return <ADHDPlaceholder title="I Can't Get Started" emoji="🪨" color={C.teal} bg="#E8F7F2" onBack={back("more")}/>;
    if(sub==="adhd_reset")       return <ADHDPlaceholder title="Help Me Reset" emoji="🔄" color={C.coral} bg="#FDEEF1" onBack={back("more")}/>;
    if(tab==="home")     return <HomeScreen tasks={tasks} setTasks={setTasks} setSubScreen={setSub} setEditId={setEditId} completedChores={completedChores} setTab={goTab} todos={todos} setTodos={setTodos}/>;
    if(tab==="tasks")    return <TasksScreen tasks={tasks} setTasks={setTasks} setSubScreen={setSub} setEditId={setEditId}/>;
    if(tab==="random")   return <RandomTab randomChores={randomChores} setRandomChores={setRandomChores} completedChores={completedChores} setCompletedChores={setCompletedChores} setSubScreen={setSub}/>;
    if(tab==="progress") return <ProgressScreen tasks={tasks} completedChores={completedChores} setSubScreen={setSub}/>;
    if(tab==="more")     return <MoreTab setSubScreen={setSub}/>;
  };
  if(splash)return(<SplashScreen/>);
  return(<div style={{background:"#F8F9FA",minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Nunito','Poppins',system-ui,sans-serif"}}><div style={{overflowY:"auto",minHeight:"100vh",paddingBottom:80}}>{render()}</div><BottomNav tab={sub?"":tab} setTab={goTab}/></div>);
}
