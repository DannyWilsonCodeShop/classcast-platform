import { RubricCategory } from '@/types/rubric';

/**
 * Pre-built template rubrics for common video assignment types.
 * Designed for ClassCast's video assignment platform — templates include
 * the most common grading categories with pre-written level descriptions
 * so instructors only need to tailor, not write from scratch.
 */
export const TEMPLATE_RUBRICS: Record<string, { label: string; description: string; categories: RubricCategory[] }> = {
  video_presentation: {
    label: 'Video Presentation',
    description: 'General video assignment with content, delivery, and production quality',
    categories: [
      {
        id: 'tpl_vid_content',
        name: 'Content & Knowledge',
        levels: [
          { score: 5, description: 'Demonstrates thorough understanding with accurate, comprehensive coverage of the topic' },
          { score: 4, description: 'Shows strong understanding with minor gaps in coverage' },
          { score: 3, description: 'Adequate understanding of main concepts but lacks depth' },
          { score: 2, description: 'Limited understanding with notable inaccuracies or missing content' },
          { score: 1, description: 'Minimal relevant content or significant misunderstandings' },
          { score: 0, description: 'No relevant content presented' }
        ]
      },
      {
        id: 'tpl_vid_delivery',
        name: 'Delivery & Communication',
        levels: [
          { score: 5, description: 'Clear, confident, engaging delivery with excellent eye contact and pacing' },
          { score: 4, description: 'Clear delivery with good pacing and mostly natural presence' },
          { score: 3, description: 'Understandable delivery but reads from notes or has uneven pacing' },
          { score: 2, description: 'Difficult to follow due to mumbling, rushing, or excessive pauses' },
          { score: 1, description: 'Very difficult to understand or mostly reads a script word-for-word' },
          { score: 0, description: 'Inaudible or no verbal communication' }
        ]
      },
      {
        id: 'tpl_vid_organization',
        name: 'Organization & Structure',
        levels: [
          { score: 3, description: 'Clear introduction, logical flow, and strong conclusion' },
          { score: 2, description: 'Has structure but transitions are weak or conclusion is abrupt' },
          { score: 1, description: 'Disorganized with no clear beginning, middle, or end' },
          { score: 0, description: 'No discernible structure' }
        ]
      },
      {
        id: 'tpl_vid_production',
        name: 'Video & Audio Quality',
        levels: [
          { score: 2, description: 'Clear audio, good lighting, stable camera, appropriate framing' },
          { score: 1, description: 'Some audio or video issues but content is still understandable' },
          { score: 0, description: 'Poor quality making content difficult to engage with' }
        ]
      }
    ]
  },
  math_video_explanation: {
    label: 'Math Video Explanation',
    description: 'Video where students explain math problem-solving step by step',
    categories: [
      {
        id: 'tpl_math_accuracy',
        name: 'Mathematical Accuracy',
        levels: [
          { score: 5, description: 'All calculations correct with proper mathematical reasoning shown' },
          { score: 4, description: 'Minor computational errors that don\'t affect the overall approach' },
          { score: 3, description: 'Correct approach but several calculation errors' },
          { score: 2, description: 'Some correct elements but fundamental misunderstanding evident' },
          { score: 1, description: 'Mostly incorrect with major conceptual errors' },
          { score: 0, description: 'No mathematical content or entirely incorrect' }
        ]
      },
      {
        id: 'tpl_math_explanation',
        name: 'Explanation & Work Shown',
        levels: [
          { score: 5, description: 'Every step clearly explained with reasoning — a viewer could replicate the solution' },
          { score: 4, description: 'Most steps explained clearly with only minor gaps in reasoning' },
          { score: 3, description: 'Key steps shown but explanations are incomplete or skip logic' },
          { score: 2, description: 'Minimal explanation — shows answers without showing how' },
          { score: 1, description: 'Little to no explanation of process' },
          { score: 0, description: 'No work shown' }
        ]
      },
      {
        id: 'tpl_math_notation',
        name: 'Notation & Visual Clarity',
        levels: [
          { score: 3, description: 'Proper notation, neat handwriting/typing, easy to read on video' },
          { score: 2, description: 'Generally readable but some notation issues or messy writing' },
          { score: 1, description: 'Difficult to read or follow visually' },
          { score: 0, description: 'Unreadable or no visual work displayed' }
        ]
      },
      {
        id: 'tpl_math_delivery',
        name: 'Verbal Delivery',
        levels: [
          { score: 2, description: 'Clear, audible explanation at an appropriate pace' },
          { score: 1, description: 'Understandable but rushes, mumbles, or has long pauses' },
          { score: 0, description: 'Inaudible or no verbal explanation' }
        ]
      }
    ]
  },
  discussion_response: {
    label: 'Video Discussion Response',
    description: 'Student responds to a prompt or discusses a topic on camera',
    categories: [
      {
        id: 'tpl_disc_depth',
        name: 'Depth of Response',
        levels: [
          { score: 5, description: 'Thoughtful, nuanced response that goes beyond surface-level with specific examples' },
          { score: 4, description: 'Good depth with some specific examples or evidence' },
          { score: 3, description: 'Addresses the prompt adequately but stays surface-level' },
          { score: 2, description: 'Minimal engagement with the topic or overly brief' },
          { score: 1, description: 'Barely addresses the prompt' },
          { score: 0, description: 'Does not address the prompt' }
        ]
      },
      {
        id: 'tpl_disc_critical',
        name: 'Critical Thinking',
        levels: [
          { score: 4, description: 'Shows original analysis, makes connections, considers multiple perspectives' },
          { score: 3, description: 'Some analysis beyond summary, attempts to make connections' },
          { score: 2, description: 'Mostly summarizes without deeper analysis' },
          { score: 1, description: 'No analysis — only restates information' },
          { score: 0, description: 'No critical engagement' }
        ]
      },
      {
        id: 'tpl_disc_communication',
        name: 'Communication & Presence',
        levels: [
          { score: 3, description: 'Engages camera naturally, speaks clearly, good energy and confidence' },
          { score: 2, description: 'Adequate communication with minor delivery issues' },
          { score: 1, description: 'Reads from notes extensively or difficult to follow' },
          { score: 0, description: 'Inaudible or no attempt at engagement' }
        ]
      },
      {
        id: 'tpl_disc_time',
        name: 'Time & Completeness',
        levels: [
          { score: 3, description: 'Meets time requirements and fully addresses all parts of the prompt' },
          { score: 2, description: 'Close to time requirements, addresses most parts of the prompt' },
          { score: 1, description: 'Significantly under time or misses major parts of the prompt' },
          { score: 0, description: 'Does not meet minimum requirements' }
        ]
      }
    ]
  },
  lab_demonstration: {
    label: 'Lab/Demo Video',
    description: 'Student demonstrates a lab procedure, experiment, or hands-on skill',
    categories: [
      {
        id: 'tpl_lab_procedure',
        name: 'Procedure & Technique',
        levels: [
          { score: 5, description: 'Demonstrates proper technique throughout with clear, safe execution' },
          { score: 4, description: 'Good technique with minor procedural missteps' },
          { score: 3, description: 'Adequate execution but some steps skipped or done incorrectly' },
          { score: 2, description: 'Multiple procedural errors or safety concerns' },
          { score: 1, description: 'Poor technique throughout' },
          { score: 0, description: 'Does not demonstrate the procedure' }
        ]
      },
      {
        id: 'tpl_lab_explanation',
        name: 'Explanation & Understanding',
        levels: [
          { score: 5, description: 'Explains what they are doing and why at each step, demonstrating deep understanding' },
          { score: 4, description: 'Good explanations with minor gaps in reasoning' },
          { score: 3, description: 'Some explanation but mostly shows without telling why' },
          { score: 2, description: 'Minimal explanation of steps or reasoning' },
          { score: 1, description: 'No explanation — just performs actions silently' },
          { score: 0, description: 'No relevant demonstration' }
        ]
      },
      {
        id: 'tpl_lab_results',
        name: 'Results & Conclusions',
        levels: [
          { score: 3, description: 'Clearly presents results and draws appropriate conclusions' },
          { score: 2, description: 'Shows results but conclusions are weak or missing' },
          { score: 1, description: 'Results unclear or no conclusions drawn' },
          { score: 0, description: 'No results presented' }
        ]
      },
      {
        id: 'tpl_lab_video',
        name: 'Video Quality & Visibility',
        levels: [
          { score: 2, description: 'All steps clearly visible, good angles, clear audio explanations' },
          { score: 1, description: 'Some steps hard to see or hear but mostly followable' },
          { score: 0, description: 'Cannot see or follow the demonstration' }
        ]
      }
    ]
  },
  creative_project: {
    label: 'Creative Project Showcase',
    description: 'Student presents a creative work (art, music, writing, design) on video',
    categories: [
      {
        id: 'tpl_create_originality',
        name: 'Creativity & Originality',
        levels: [
          { score: 5, description: 'Highly original approach that takes creative risks and shows personal voice' },
          { score: 4, description: 'Creative approach with some original elements' },
          { score: 3, description: 'Follows the assignment but adds little personal touch' },
          { score: 2, description: 'Mostly generic with no creative effort beyond minimum' },
          { score: 1, description: 'No creative engagement' },
          { score: 0, description: 'No submission' }
        ]
      },
      {
        id: 'tpl_create_craft',
        name: 'Craftsmanship & Effort',
        levels: [
          { score: 4, description: 'Polished final product showing significant time and care invested' },
          { score: 3, description: 'Good effort evident with a mostly complete product' },
          { score: 2, description: 'Some effort but feels rushed or incomplete' },
          { score: 1, description: 'Minimal effort evident' },
          { score: 0, description: 'No meaningful product' }
        ]
      },
      {
        id: 'tpl_create_explanation',
        name: 'Artist Statement / Explanation',
        levels: [
          { score: 3, description: 'Clearly explains their creative choices, process, and inspiration' },
          { score: 2, description: 'Some explanation of choices but lacks depth' },
          { score: 1, description: 'Minimal or no explanation of creative process' },
          { score: 0, description: 'No explanation provided' }
        ]
      },
      {
        id: 'tpl_create_presentation',
        name: 'Presentation Quality',
        levels: [
          { score: 3, description: 'Work is well-presented, clearly visible/audible, and professionally showcased' },
          { score: 2, description: 'Adequate presentation with minor issues' },
          { score: 1, description: 'Poor presentation affecting ability to appreciate the work' },
          { score: 0, description: 'Cannot see/hear the work' }
        ]
      }
    ]
  }
};
