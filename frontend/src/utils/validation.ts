const NAME_REGEX = /^[A-Za-z][A-Za-z\s]{1,79}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\d{10}$/;
const URL_REGEX = /^https?:\/\/\S+$/i;

const hasLetter = (value: string) => /[A-Za-z]/.test(value);

type StudentValidationInput = {
  name: string;
  email: string;
  password?: string;
  branch: string;
  gender: string;
  cgpa: number | string;
  skills: string;
  projects?: string;
  resumeLink?: string;
  phone: string;
  university: string;
  graduationYear: number | string;
};

export const validateStudentFields = (
  input: StudentValidationInput,
  options?: {
    requirePassword?: boolean;
    requireProjects?: boolean;
    requireResumeLink?: boolean;
  }
): string[] => {
  const errors: string[] = [];
  const currentYear = new Date().getFullYear();

  const name = input.name.trim();
  const email = input.email.trim();
  const password = (input.password ?? '').trim();
  const branch = input.branch.trim();
  const gender = input.gender.trim();
  const skills = input.skills.trim();
  const projects = (input.projects ?? '').trim();
  const resumeLink = (input.resumeLink ?? '').trim();
  const phone = input.phone.trim();
  const university = input.university.trim();

  const cgpa = Number(input.cgpa);
  const graduationYear = Number(input.graduationYear);

  if (!name) {
    errors.push('Name is required');
  } else if (!NAME_REGEX.test(name)) {
    errors.push('Name should contain only letters and spaces');
  }

  if (!email) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Enter a valid email address');
  }

  if (options?.requirePassword && !password) {
    errors.push('Password is required');
  }

  if (password && password.length < 3) {
    errors.push('Password must be at least 3 characters');
  }

  if (!branch) {
    errors.push('Branch is required');
  } else if (!hasLetter(branch)) {
    errors.push('Branch must contain alphabetic characters');
  }

  if (!gender) {
    errors.push('Gender is required');
  } else if (!['Male', 'Female', 'Other'].includes(gender)) {
    errors.push('Gender must be Male, Female or Other');
  }

  if (Number.isNaN(cgpa)) {
    errors.push('CGPA is required');
  } else if (cgpa < 0 || cgpa > 10) {
    errors.push('CGPA must be between 0 and 10');
  }

  if (!skills) {
    errors.push('Skills are required');
  } else if (!hasLetter(skills)) {
    errors.push('Skills must contain alphabetic characters');
  }

  if (options?.requireProjects && !projects) {
    errors.push('Projects are required');
  } else if (projects && !hasLetter(projects)) {
    errors.push('Projects must contain alphabetic characters');
  }

  if (options?.requireResumeLink && !resumeLink) {
    errors.push('Resume link is required');
  } else if (resumeLink && !URL_REGEX.test(resumeLink)) {
    errors.push('Resume link must be a valid http/https URL');
  }

  if (!phone) {
    errors.push('Phone number is required');
  } else if (!PHONE_REGEX.test(phone)) {
    errors.push('Phone number must be exactly 10 digits');
  }

  if (!university) {
    errors.push('University is required');
  } else if (!hasLetter(university)) {
    errors.push('University must contain alphabetic characters');
  }

  if (Number.isNaN(graduationYear)) {
    errors.push('Graduation year is required');
  } else if (graduationYear < 2000 || graduationYear > currentYear + 10) {
    errors.push(`Graduation year must be between 2000 and ${currentYear + 10}`);
  }

  return errors;
};

export const validateCompanyFields = (input: {
  name: string;
  role: string;
  packageOffered: number | string;
  password?: string;
}): string[] => {
  const errors: string[] = [];
  const name = input.name.trim();
  const role = input.role.trim();
  const rawPassword = (input.password ?? '').trim();
  const packageOffered = Number(input.packageOffered);

  if (!name) {
    errors.push('Company name is required');
  } else if (!NAME_REGEX.test(name)) {
    errors.push('Company name should contain only letters and spaces');
  }

  if (!role) {
    errors.push('Role / department is required');
  } else if (!hasLetter(role)) {
    errors.push('Role / department must contain alphabetic characters');
  }

  if (Number.isNaN(packageOffered) || packageOffered <= 0) {
    errors.push('Package offered must be greater than 0');
  }

  if (rawPassword && rawPassword.length < 3) {
    errors.push('Password must be at least 3 characters');
  }

  return errors;
};
