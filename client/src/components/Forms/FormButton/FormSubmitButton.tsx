import styles from "./FormSubmitButton.module.css";

export interface FormSubmitButtonProps {
  text: string;
  disabled?: boolean;
}

const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  text,
  disabled,
}) => {
  return (
    <button
      type="submit"
      className={styles.formSubmitButton}
      disabled={disabled}
      aria-label={text}
    >
      {text}
    </button>
  );
};

export default FormSubmitButton;
