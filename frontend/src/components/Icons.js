import React from 'react';
import {
  // Navigation & UI
  MdDashboard,
  MdMenu,
  MdPerson,
  MdExitToApp,
  MdSettings,
  
  // Education & Learning
  MdSchool,
  MdClass,
  MdPeople,
  MdAssignment,
  MdVideoLibrary,
  MdPlayCircleOutline,
  MdUpload,
  MdAdd,
  MdEdit,
  MdDelete,
  
  // Status & Actions
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdTrendingUp,
  MdCalendarToday,
  MdAttachFile,
  MdFolderOpen,
  MdLightbulb,
  MdWarning,
  MdChat,
  MdStar,
  MdThumbUp,
  
  // Quick Actions
  MdFlashOn,
  MdNoteAdd,
  MdAssessment,
  MdGroupAdd,
  
  // File & Media
  MdVideoFile,
  MdDescription,
  MdImage,
  MdCloudUpload,
  
  // Statistics
  MdBarChart,
  MdPieChart,
  MdShowChart,
  MdTimeline
} from 'react-icons/md';

// Icon mapping for easy replacement
export const Icons = {
  // Navigation
  dashboard: MdDashboard,
  menu: MdMenu,
  profile: MdPerson,
  logout: MdExitToApp,
  settings: MdSettings,
  
  // Education
  classes: MdSchool,
  class: MdClass,
  students: MdPeople,
  assignments: MdAssignment,
  videos: MdVideoLibrary,
  video: MdPlayCircleOutline,
  upload: MdUpload,
  add: MdAdd,
  edit: MdEdit,
  delete: MdDelete,
  
  // Status
  present: MdCheckCircle,
  absent: MdCancel,
  late: MdSchedule,
  trending: MdTrendingUp,
  calendar: MdCalendarToday,
  attach: MdAttachFile,
  folder: MdFolderOpen,
  lightbulb: MdLightbulb,
  warning: MdWarning,
  chat: MdChat,
  star: MdStar,
  thumbsUp: MdThumbUp,
  
  // Quick Actions
  quickActions: MdFlashOn,
  createAssignment: MdNoteAdd,
  attendance: MdAssessment,
  addStudent: MdGroupAdd,
  
  // File & Media
  videoFile: MdVideoFile,
  document: MdDescription,
  image: MdImage,
  cloudUpload: MdCloudUpload,
  
  // Statistics
  barChart: MdBarChart,
  pieChart: MdPieChart,
  lineChart: MdShowChart,
  timeline: MdTimeline
};

// Icon component with consistent styling
export const Icon = ({ 
  name, 
  size = 20, 
  color = 'currentColor', 
  className = '', 
  style = {} 
}) => {
  const IconComponent = Icons[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <IconComponent 
      size={size} 
      color={color} 
      className={className}
      style={style}
    />
  );
};

// Predefined icon sets for common use cases
export const IconSets = {
  // Navigation icons
  nav: {
    dashboard: 'dashboard',
    classes: 'classes',
    students: 'students',
    assignments: 'assignments',
    attendance: 'attendance',
    menu: 'menu',
    profile: 'profile',
    logout: 'logout'
  },
  
  // Quick action icons
  quickActions: {
    createClass: 'classes',
    uploadVideo: 'video',
    createAssignment: 'createAssignment',
    markAttendance: 'attendance',
    addStudent: 'addStudent'
  },
  
  // Status icons
  status: {
    present: 'present',
    absent: 'absent',
    late: 'late',
    success: 'present',
    error: 'absent',
    warning: 'warning'
  },
  
  // File type icons
  fileTypes: {
    video: 'videoFile',
    document: 'document',
    image: 'image',
    attachment: 'attach'
  }
};

export default Icon;
