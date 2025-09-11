"""
HTML parsing router for Planning Center bulletin parsing
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import json
import re
from bs4 import BeautifulSoup

router = APIRouter()

def extract_personnel_from_text(text: str, personnel: List[str]) -> tuple[str, str]:
    """Extract personnel name from text"""
    found_personnel = ""
    cleaned_text = text
    
    for person in personnel:
        variations = [
            person,
            person.lower(),
            f"by {person}",
            f"read by {person}",
            f"led by {person}",
            f"- {person}",
            f"({person})",
        ]
        
        for variation in variations:
            if variation.lower() in text.lower():
                found_personnel = person
                # Clean the text
                import re
                pattern = re.compile(re.escape(variation), re.IGNORECASE)
                cleaned_text = pattern.sub('', cleaned_text).strip()
                cleaned_text = re.sub(r'^[-,\s]+|[-,\s]+$', '', cleaned_text)
                break
        
        if found_personnel:
            break
    
    return cleaned_text, found_personnel

def parse_html_content(html_content: str, templates: List[Dict[str, Any]] = None, personnel: List[str] = None) -> Dict[str, Any]:
    """Parse HTML content and extract bulletin items"""
    import re  # Import here to avoid scope issues
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Use provided templates and personnel or defaults
    if templates is None:
        templates = []
    if personnel is None:
        personnel = []
    
    # Find base template
    base_template = None
    for template in templates:
        if 'base' in template.get('name', '').lower():
            base_template = template
            break
    
    # If no base template found, use first template
    if not base_template and templates:
        base_template = templates[0]
    
    # Extract items from HTML - matching TypeScript logic exactly
    title_spans = soup.find_all('span', class_='title')
    extracted_items = []
    
    # Track sections for context-aware matching
    current_section = None
    hymn_count = 0
    
    for span in title_spans:
        text = span.get_text(strip=True)
        if not text:
            continue
        
        # Check if this is a section header (check parent for header class)
        parent = span.parent
        if parent and parent.parent:
            grandparent = parent.parent
            if grandparent.get('class') and 'header-wrapper' in grandparent.get('class'):
                # This is inside a header section, get the section name
                header_td = grandparent.find('td', class_='header')
                if header_td:
                    current_section = header_td.get_text(strip=True).upper()
                continue  # Skip section headers
            
        # Look for description element - match TypeScript logic
        description_element = None
        current_element = span.parent
        
        # Search for item--description
        while current_element and not description_element:
            # Check if current element has item--description class
            if current_element.get('class') and 'item--description' in current_element.get('class'):
                description_element = current_element
                break
            
            # Check children for item--description
            child_description = current_element.find(class_='item--description')
            if child_description:
                description_element = child_description
                break
            
            # Move to next sibling
            current_element = current_element.next_sibling
            # Skip text nodes
            while current_element and not hasattr(current_element, 'get'):
                current_element = current_element.next_sibling
        
        description = ""
        if description_element:
            description = description_element.get_text(strip=True)
        
        # Track hymn count for context-aware classification
        if 'hymn' in text.lower():
            hymn_count += 1
        
        extracted_items.append({
            'text': text,
            'description': description,
            'section': current_section,
            'hymn_position': hymn_count if 'hymn' in text.lower() else 0
        })
    
    # Process items with template matching - match TypeScript exactly
    bulletin_items = []
    
    if not base_template:
        # No template - create items from extracted text
        for item in extracted_items:
            found_personnel = ''
            actual_description = item['description'] or ''
            
            # Check if description contains personnel
            if item['description']:
                actual_description, desc_personnel = extract_personnel_from_text(item['description'], personnel)
                if desc_personnel:
                    found_personnel = desc_personnel
                    # If the entire description was just the personnel name, clear it
                    if not actual_description or len(actual_description) == 0:
                        actual_description = ''
            
            # If no personnel found in description, check the text
            if not found_personnel:
                _, text_personnel = extract_personnel_from_text(item['text'], personnel)
                found_personnel = text_personnel
            
            bulletin_items.append({
                'Text': item['text'],
                'Name': '',
                'Description': actual_description,
                'Personnel': found_personnel,
                'Standing': False,
                'wasMatched': False
            })
    else:
        template_items = base_template.get('items', [])
        used_template_indices = set()
        
        for idx, extracted_item in enumerate(extracted_items):
            matched_template_item = None
            matched_index = -1
            matched_alias = None
            
            # Special handling for specific items based on Planning Center conventions
            lower_text = extracted_item['text'].lower()
            
            # Add special text expansions for certain items
            if 'blowing of the shell' in lower_text and '(pu)' in lower_text:
                # Expand PU to full text
                extracted_item['text'] = extracted_item['text'].replace('(PU)', '(pu in Hawaiian, kele\'a in Tongan)')
            
            # Handle "OFFERING PRAYER" -> "Prayer of Dedication"
            if 'offering prayer' in lower_text:
                for t_idx, template_item in enumerate(template_items):
                    if t_idx not in used_template_indices:
                        if 'prayer of dedication' in template_item.get('item_name', '').lower():
                            matched_template_item = template_item
                            matched_index = t_idx
                            matched_alias = 'offering prayer'
                            break
            
            # Handle "OFFERING" (without prayer) -> "Offertory"
            elif lower_text == 'offering':
                for t_idx, template_item in enumerate(template_items):
                    if t_idx not in used_template_indices:
                        if 'offertory' in template_item.get('item_name', '').lower():
                            matched_template_item = template_item
                            matched_index = t_idx
                            matched_alias = 'offering'
                            break
            
            # Handle "GREETING" -> "Welcome"
            elif lower_text == 'greeting':
                for t_idx, template_item in enumerate(template_items):
                    if t_idx not in used_template_indices:
                        if 'welcome' in template_item.get('item_name', '').lower():
                            matched_template_item = template_item
                            matched_index = t_idx
                            matched_alias = 'greeting'
                            break
            
            # Special handling for hymns - use context to determine which hymn
            elif 'hymn' in lower_text:
                hymn_position = extracted_item.get('hymn_position', 0)
                section = extracted_item.get('section', '')
                
                # Determine which hymn based on position and section
                if hymn_position == 1 or section == 'GATHERING':
                    # First hymn or in GATHERING section = Opening Hymn
                    for t_idx, template_item in enumerate(template_items):
                        if t_idx not in used_template_indices:
                            if 'opening hymn' in template_item.get('item_name', '').lower():
                                matched_template_item = template_item
                                matched_index = t_idx
                                matched_alias = 'opening hymn'
                                break
                elif section == 'SENDING FORTH' or hymn_position >= 3:
                    # In SENDING FORTH section or 3rd+ hymn = Closing Hymn
                    for t_idx, template_item in enumerate(template_items):
                        if t_idx not in used_template_indices:
                            if 'closing hymn' in template_item.get('item_name', '').lower():
                                matched_template_item = template_item
                                matched_index = t_idx
                                matched_alias = 'closing hymn'
                                break
                else:
                    # Middle hymn = regular Hymn
                    for t_idx, template_item in enumerate(template_items):
                        if t_idx not in used_template_indices:
                            item_name = template_item.get('item_name', '').lower()
                            if item_name == 'hymn':  # Exact match for middle hymn
                                matched_template_item = template_item
                                matched_index = t_idx
                                matched_alias = 'hymn'
                                break
            
            # If not a hymn or hymn matching failed, try order-based matching
            if not matched_template_item and idx < len(template_items) and idx not in used_template_indices:
                # Check if text matches template item
                normalized_text = extracted_item['text'].lower().strip()
                template_item = template_items[idx]
                
                # Check aliases first
                aliases = template_item.get('item_aliases', [])
                for alias in aliases:
                    normalized_alias = alias.lower().strip()
                    if (normalized_text == normalized_alias or 
                        normalized_alias in normalized_text or 
                        normalized_text in normalized_alias):
                        matched_template_item = template_item
                        matched_index = idx
                        matched_alias = alias
                        break
                
                # Check item_name if no alias match
                if not matched_template_item:
                    item_name = template_item.get('item_name', '').lower().strip()
                    if (normalized_text == item_name or 
                        item_name in normalized_text or 
                        normalized_text in item_name):
                        matched_template_item = template_item
                        matched_index = idx
            
            # If no order match, search all unused template items
            if not matched_template_item:
                normalized_text = extracted_item['text'].lower().strip()
                for t_idx, template_item in enumerate(template_items):
                    if t_idx not in used_template_indices:
                        # Check aliases first
                        aliases = template_item.get('item_aliases', [])
                        for alias in aliases:
                            normalized_alias = alias.lower().strip()
                            if (normalized_text == normalized_alias or 
                                normalized_alias in normalized_text or 
                                normalized_text in normalized_alias):
                                matched_template_item = template_item
                                matched_index = t_idx
                                matched_alias = alias
                                break
                        
                        if matched_template_item:
                            break
                        
                        # Check item_name
                        item_name = template_item.get('item_name', '').lower().strip()
                        if (normalized_text == item_name or 
                            item_name in normalized_text or 
                            normalized_text in item_name):
                            matched_template_item = template_item
                            matched_index = t_idx
                            break
            
            if matched_template_item and matched_index >= 0:
                used_template_indices.add(matched_index)
                
                # The description field from HTML often contains personnel info
                found_personnel = ''
                actual_description = extracted_item['description'] or ''
                
                if extracted_item['description']:
                    # Check if the description contains personnel
                    actual_description, desc_personnel = extract_personnel_from_text(extracted_item['description'], personnel)
                    if desc_personnel:
                        found_personnel = desc_personnel
                        # If the entire description was just the personnel name, clear it
                        if not actual_description or len(actual_description) == 0:
                            actual_description = ''
                
                # If no personnel found in description, check the text
                if not found_personnel:
                    _, text_personnel = extract_personnel_from_text(extracted_item['text'], personnel)
                    found_personnel = text_personnel
                
                # Extract title/description from the main text (e.g., "HYMN: Amazing Grace")
                title = ''
                if matched_alias and matched_alias.lower() in extracted_item['text'].lower():
                    regex = re.compile(re.escape(matched_alias), re.IGNORECASE)
                    title = regex.sub('', extracted_item['text']).strip()
                    title = re.sub(r'^:\s*', '', title).strip()
                elif ':' in extracted_item['text']:
                    colon_index = extracted_item['text'].index(':')
                    title = extracted_item['text'][colon_index + 1:].strip()
                
                # Use title if we have one, otherwise use the cleaned description
                final_description = title or actual_description
                
                # Special case: if description is just "SHARING OF", clear it
                if final_description == "SHARING OF":
                    final_description = ""
                
                # For the preview, always show the original HTML text
                # The Name field should contain the template name for reference
                bulletin_items.append({
                    'Text': extracted_item['text'],  # Original text from HTML
                    'Name': matched_template_item.get('item_name', ''),  # Template name
                    'Description': final_description,
                    'Personnel': found_personnel or matched_template_item.get('default_person', ''),
                    'Standing': matched_template_item.get('stand_indicator', False),
                    'wasMatched': True
                })
            else:
                # Unmatched item
                found_personnel = ''
                actual_description = extracted_item['description'] or ''
                
                # Check if description contains personnel
                if extracted_item['description']:
                    actual_description, desc_personnel = extract_personnel_from_text(extracted_item['description'], personnel)
                    if desc_personnel:
                        found_personnel = desc_personnel
                        # If the entire description was just the personnel name, clear it
                        if not actual_description or len(actual_description) == 0:
                            actual_description = ''
                
                # If no personnel found in description, check the text
                if not found_personnel:
                    _, text_personnel = extract_personnel_from_text(extracted_item['text'], personnel)
                    found_personnel = text_personnel
                
                bulletin_items.append({
                    'Text': extracted_item['text'],
                    'Name': '',
                    'Description': actual_description,
                    'Personnel': found_personnel,
                    'Standing': False,
                    'wasMatched': False
                })
    
    # Extract slide data
    slide_data = {
        'callToWorship': None,
        'hymns': [],
        'scripture': None,
        'lead_pastor': None
    }
    
    for span in title_spans:
        text = span.get_text(strip=True)
        
        # Extract Call to Worship
        if 'call to worship' in text.lower():
            import re
            ref_match = re.search(r'UMH\s+(\d+)', text, re.IGNORECASE)
            parent = span.parent
            desc_text = ""
            if parent:
                desc_elem = parent.find(class_='item--description')
                if desc_elem:
                    desc_text = desc_elem.get_text(strip=True)
            
            slide_data['callToWorship'] = {
                'text': desc_text,
                'reference': f"UMH {ref_match.group(1)}" if ref_match else None
            }
        
        # Extract Hymns
        if 'hymn' in text.lower():
            import re
            hymn_match = re.search(r'[""]([^""]+)[""].*?(UMH|FWS)\s*(\d+[a-z]?)', text, re.IGNORECASE)
            if hymn_match:
                slide_data['hymns'].append({
                    'title': hymn_match.group(1).strip(),
                    'number': hymn_match.group(3).strip(),
                    'hymnal': hymn_match.group(2).upper()
                })
        
        # Extract Scripture
        if 'scripture' in text.lower():
            import re
            # Try to match with version first
            scripture_match = re.search(r'SCRIPTURE:\s*(.+?)\s*\(?(NRSVUE|NRSVue|TMB|ESV|NIV|KJV)\)?', text, re.IGNORECASE)
            if scripture_match:
                parent = span.parent
                desc_text = ""
                if parent:
                    desc_elem = parent.find(class_='item--description')
                    if desc_elem:
                        desc_text = desc_elem.get_text(strip=True)
                
                slide_data['scripture'] = {
                    'reference': scripture_match.group(1).strip(),
                    'text': desc_text,
                    'version': scripture_match.group(2).upper()
                }
            else:
                # Try to match without version (default to NRSVUE)
                scripture_match_no_version = re.search(r'SCRIPTURE:\s*(.+?)(?:\s*$)', text, re.IGNORECASE)
                if scripture_match_no_version:
                    parent = span.parent
                    desc_text = ""
                    if parent:
                        desc_elem = parent.find(class_='item--description')
                        if desc_elem:
                            desc_text = desc_elem.get_text(strip=True)
                    
                    slide_data['scripture'] = {
                        'reference': scripture_match_no_version.group(1).strip(),
                        'text': desc_text,
                        'version': 'NRSVUE'  # Default version
                    }
        
        # Extract Lead Pastor from Greeting or Benediction
        if not slide_data['lead_pastor'] and ('greeting' in text.lower() or 'benediction' in text.lower()):
            parent = span.parent
            if parent:
                desc_elem = parent.find(class_='item--description')
                if desc_elem:
                    desc_text = desc_elem.get_text(strip=True)
                    # Look for Rev. or Pastor in the description
                    import re
                    pastor_match = re.search(r'(Rev\.|Pastor|Dr\.)\s+([^,\n]+)', desc_text)
                    if pastor_match:
                        slide_data['lead_pastor'] = pastor_match.group(0).strip()
    
    return {
        'success': True,
        'data': bulletin_items,
        'slideData': slide_data,
        'filename': 'uploaded.html'
    }

@router.post("/parse-html")
async def parse_html(
    htmlFile: UploadFile = File(...),
    templates: Optional[str] = Form(None),
    personnel: Optional[str] = Form(None)
):
    """Parse uploaded HTML file with optional templates and personnel data"""
    try:
        # Read file content
        content = await htmlFile.read()
        html_content = content.decode('utf-8')
        
        # Parse templates and personnel if provided as JSON strings
        templates_list = json.loads(templates) if templates else []
        personnel_list = json.loads(personnel) if personnel else []
        
        # Parse the HTML
        result = parse_html_content(html_content, templates_list, personnel_list)
        result['filename'] = htmlFile.filename
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))