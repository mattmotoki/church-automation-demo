export interface BulletinItem {
  id: string;
  stand_indicator: boolean;     // Whether congregation should stand (adds * prefix)
  item_name: string;            // Display name for the bulletin item
  item_aliases: string[];       // Alternative names for HTML parsing mapping
  title: string;                // Specific title/content for this service (blank in templates, filled when parsing HTML)
  parsing_required: boolean;    // Whether title extraction from HTML is required
  personnel: string;            // Person leading this bulletin item
  role: string;                 // Role(s) assigned to this item (comma-separated for multiple roles)
  default_person: string;       // Default person for this item from template
}

export interface ParsedData {
  Title: string;
  Notes: string;
  Personnel: string;
}

export interface Template {
  name: string;                 // Human-readable name (serves as unique identifier)
  items: BulletinItem[];        // Array of bulletin items with defaults
}

// Dynamic role-based assignment system
export interface RoleAssignment {
  role: string;
  person: string;
  tasks: string[];
}

export interface ServiceRoles {
  [role: string]: string;
}

export interface TemplateRole {
  name: string;
  tasks: string[];
  defaultPerson?: string;
}

// Extract roles from template items
export function extractRolesFromTemplate(items: BulletinItem[]): TemplateRole[] {
  const roleMap = new Map<string, TemplateRole>();
  
  items.forEach(item => {
    if (item.role) {
      // Handle multiple roles (comma-separated)
      const roles = item.role.split(',').map(r => r.trim()).filter(r => r);
      
      roles.forEach(roleName => {
        if (!roleMap.has(roleName)) {
          roleMap.set(roleName, {
            name: roleName,
            tasks: [],
            defaultPerson: item.default_person || undefined
          });
        }
        
        const role = roleMap.get(roleName)!;
        if (!role.tasks.includes(item.item_name)) {
          role.tasks.push(item.item_name);
        }
        
        // Use default person if not already set
        if (!role.defaultPerson && item.default_person) {
          role.defaultPerson = item.default_person;
        }
      });
    }
  });
  
  return Array.from(roleMap.values());
}

// Create role assignments from template roles
export function createServiceRolesFromTemplate(templateRoles: TemplateRole[]): ServiceRoles {
  const serviceRoles: ServiceRoles = {};
  
  templateRoles.forEach(role => {
    serviceRoles[role.name] = role.defaultPerson || '';
  });
  
  return serviceRoles;
}