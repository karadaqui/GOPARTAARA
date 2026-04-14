import { useMotTaxReminders } from "@/hooks/useMotTaxReminders";

/** Invisible component that runs MOT/Tax reminder checks on login */
const MotTaxReminderRunner = () => {
  useMotTaxReminders();
  return null;
};

export default MotTaxReminderRunner;
