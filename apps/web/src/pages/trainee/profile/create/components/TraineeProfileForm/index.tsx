import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Ruler, Dumbbell, Shield } from "lucide-react";
import {
  createTraineeProfileSchema,
  type CreateTraineeProfileInput,
  FITNESS_GOALS,
  GENDER_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
} from "@fitnassist/schemas";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Switch,
  ImageUpload,
  Select,
  AddressAutocomplete,
  type AddressDetails,
  type SelectOption,
} from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { routes } from "@/config/routes";
import { env } from "@/config/env";
import { useAuth } from "@/hooks";
import { feetInchesToCm, lbsToKg } from "@/lib/unitConversion";

const genderOptions = GENDER_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));
const experienceOptions = EXPERIENCE_LEVEL_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));
const activityOptions = ACTIVITY_LEVEL_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export const TraineeProfileForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unitPref, setUnitPref] = useState<"METRIC" | "IMPERIAL">("METRIC");

  // Imperial display state
  const [heightFeet, setHeightFeet] = useState<string>("");
  const [heightInches, setHeightInches] = useState<string>("");
  const [weightLbs, setWeightLbs] = useState<string>("");
  const [goalWeightLbs, setGoalWeightLbs] = useState<string>("");

  const getUploadParamsMutation = trpc.upload.getUploadParams.useMutation();

  const handleUpload = async (file: File): Promise<string> => {
    const params = await getUploadParamsMutation.mutateAsync({
      type: "profile",
    });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", params.apiKey);
    formData.append("timestamp", params.timestamp.toString());
    formData.append("signature", params.signature);
    formData.append("folder", params.folder);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
      { method: "POST", body: formData },
    );
    const result = await response.json();
    return result.secure_url;
  };

  const utils = trpc.useUtils();
  const createMutation = trpc.trainee.create.useMutation({
    onSuccess: () => {
      utils.trainee.hasProfile.invalidate();
      utils.trainee.getMyProfile.invalidate();
      navigate(routes.dashboard);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateTraineeProfileInput>({
    resolver: zodResolver(createTraineeProfileSchema),
    defaultValues: {
      unitPreference: "METRIC",
      fitnessGoals: [],
      avatarUrl: user?.image || "",
    },
  });

  const fitnessGoals = watch("fitnessGoals");

  const toggleGoal = (value: string) => {
    const current = fitnessGoals || [];
    const updated = current.includes(value)
      ? current.filter((g) => g !== value)
      : [...current, value];
    setValue("fitnessGoals", updated);
  };

  const handleUnitToggle = (isImperial: boolean) => {
    const newUnit = isImperial ? "IMPERIAL" : "METRIC";
    setUnitPref(newUnit);
    setValue("unitPreference", newUnit);
  };

  const handleImperialHeightChange = (feet: string, inches: string) => {
    setHeightFeet(feet);
    setHeightInches(inches);
    const f = parseFloat(feet) || 0;
    const i = parseFloat(inches) || 0;
    if (f > 0 || i > 0) {
      setValue("heightCm", Math.round(feetInchesToCm(f, i) * 10) / 10);
    }
  };

  const handleImperialWeightChange = (
    lbs: string,
    field: "startWeightKg" | "goalWeightKg",
  ) => {
    if (field === "startWeightKg") setWeightLbs(lbs);
    else setGoalWeightLbs(lbs);
    const val = parseFloat(lbs);
    if (!isNaN(val) && val > 0) {
      setValue(field, lbsToKg(val));
    }
  };

  const onSubmit = async (data: CreateTraineeProfileInput) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Photo
          </CardTitle>
          <CardDescription>
            Upload a profile photo or use your account image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="avatarUrl"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Profile Photo"
                description="A clear photo helps trainers recognise you."
                value={field.value || undefined}
                onChange={(url) => field.onChange(url || "")}
                onUpload={handleUpload}
                aspectRatio="square"
              />
            )}
          />
        </CardContent>
      </Card>

      {/* About Me Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            About Me
          </CardTitle>
          <CardDescription>
            Tell trainers a bit about yourself. All fields are optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell trainers about yourself, your fitness journey, and what you're looking for..."
              {...register("bio")}
              rows={4}
            />
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
            </div>

            <div>
              <Label>Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    options={genderOptions}
                    value={
                      genderOptions.find((o) => o.value === field.value) || null
                    }
                    onChange={(opt: SelectOption | null) =>
                      field.onChange(opt?.value || undefined)
                    }
                    placeholder="Prefer not to say"
                    isClearable
                  />
                )}
              />
            </div>
          </div>

          <AddressAutocomplete
            apiKey={env.GOOGLE_MAPS_API_KEY}
            label="Address"
            value={{
              addressLine1: watch("addressLine1") || "",
              addressLine2: watch("addressLine2") || "",
              city: watch("city") || "",
              county: watch("county") || "",
              postcode: watch("postcode") || "",
              country: watch("country") || "GB",
              placeId: watch("placeId") || "",
              latitude: watch("latitude") || 0,
              longitude: watch("longitude") || 0,
            }}
            onChange={(address: AddressDetails | null) => {
              if (address) {
                setValue("addressLine1", address.addressLine1, { shouldDirty: true });
                setValue("addressLine2", address.addressLine2, { shouldDirty: true });
                setValue("city", address.city, { shouldDirty: true });
                setValue("county", address.county, { shouldDirty: true });
                setValue("postcode", address.postcode, { shouldDirty: true });
                setValue("country", address.country, { shouldDirty: true });
                setValue("placeId", address.placeId, { shouldDirty: true });
                setValue("latitude", address.latitude, { shouldDirty: true });
                setValue("longitude", address.longitude, { shouldDirty: true });
              } else {
                setValue("addressLine1", "", { shouldDirty: true });
                setValue("addressLine2", "", { shouldDirty: true });
                setValue("city", "", { shouldDirty: true });
                setValue("county", "", { shouldDirty: true });
                setValue("postcode", "", { shouldDirty: true });
                setValue("placeId", "", { shouldDirty: true });
                setValue("latitude", undefined, { shouldDirty: true });
                setValue("longitude", undefined, { shouldDirty: true });
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Body Metrics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Body Metrics
          </CardTitle>
          <CardDescription>
            Share your measurements to help trainers tailor their approach.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label>Units</Label>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${unitPref === "METRIC" ? "font-medium" : "text-muted-foreground"}`}
              >
                Metric
              </span>
              <Switch
                checked={unitPref === "IMPERIAL"}
                onCheckedChange={handleUnitToggle}
              />
              <span
                className={`text-sm ${unitPref === "IMPERIAL" ? "font-medium" : "text-muted-foreground"}`}
              >
                Imperial
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Height</Label>
              {unitPref === "METRIC" ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="170"
                    {...register("heightCm", { valueAsNumber: true })}
                  />
                  <span className="text-sm text-muted-foreground">cm</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="5"
                    value={heightFeet}
                    onChange={(e) =>
                      handleImperialHeightChange(e.target.value, heightInches)
                    }
                  />
                  <span className="text-sm text-muted-foreground">ft</span>
                  <Input
                    type="number"
                    placeholder="10"
                    value={heightInches}
                    onChange={(e) =>
                      handleImperialHeightChange(heightFeet, e.target.value)
                    }
                  />
                  <span className="text-sm text-muted-foreground">in</span>
                </div>
              )}
              {errors.heightCm && (
                <p className="text-sm text-destructive">
                  {errors.heightCm.message}
                </p>
              )}
            </div>

            <div>
              <Label>Start Weight</Label>
              {unitPref === "METRIC" ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="75"
                    {...register("startWeightKg", { valueAsNumber: true })}
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="165"
                    value={weightLbs}
                    onChange={(e) =>
                      handleImperialWeightChange(
                        e.target.value,
                        "startWeightKg",
                      )
                    }
                  />
                  <span className="text-sm text-muted-foreground">lbs</span>
                </div>
              )}
              {errors.startWeightKg && (
                <p className="text-sm text-destructive">
                  {errors.startWeightKg.message}
                </p>
              )}
            </div>

            <div>
              <Label>Goal Weight</Label>
              {unitPref === "METRIC" ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70"
                    {...register("goalWeightKg", { valueAsNumber: true })}
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="155"
                    value={goalWeightLbs}
                    onChange={(e) =>
                      handleImperialWeightChange(e.target.value, "goalWeightKg")
                    }
                  />
                  <span className="text-sm text-muted-foreground">lbs</span>
                </div>
              )}
              {errors.goalWeightKg && (
                <p className="text-sm text-destructive">
                  {errors.goalWeightKg.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fitness Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Fitness Information
          </CardTitle>
          <CardDescription>
            Help trainers understand your experience and goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Experience Level</Label>
              <Controller
                name="experienceLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    options={experienceOptions}
                    value={
                      experienceOptions.find((o) => o.value === field.value) ||
                      null
                    }
                    onChange={(opt: SelectOption | null) =>
                      field.onChange(opt?.value || undefined)
                    }
                    placeholder="Select..."
                    isClearable
                  />
                )}
              />
            </div>

            <div>
              <Label>Activity Level</Label>
              <Controller
                name="activityLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    options={activityOptions}
                    value={
                      activityOptions.find((o) => o.value === field.value) ||
                      null
                    }
                    onChange={(opt: SelectOption | null) =>
                      field.onChange(opt?.value || undefined)
                    }
                    placeholder="Select..."
                    isClearable
                  />
                )}
              />
            </div>
          </div>

          <div>
            <Label>Fitness Goals</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {FITNESS_GOALS.map((goal) => (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => toggleGoal(goal.value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    fitnessGoals?.includes(goal.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input hover:bg-muted/50"
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="fitnessGoalNotes">Goal Notes</Label>
            <Textarea
              id="fitnessGoalNotes"
              placeholder="Any specific goals or targets you're working towards..."
              {...register("fitnessGoalNotes")}
              rows={3}
            />
            {errors.fitnessGoalNotes && (
              <p className="text-sm text-destructive">
                {errors.fitnessGoalNotes.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="medicalNotes">Medical Notes</Label>
            <Textarea
              id="medicalNotes"
              placeholder="Any injuries, conditions, or medical information trainers should know about..."
              {...register("medicalNotes")}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This information is only shared with your connected trainers.
            </p>
            {errors.medicalNotes && (
              <p className="text-sm text-destructive">
                {errors.medicalNotes.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>
            Control who can see your profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Privacy settings</p>
            <p className="text-sm text-muted-foreground">
              After creating your profile, you can configure detailed privacy settings
              from the Privacy tab to control exactly who can see each part of your profile.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {createMutation.error && (
        <p className="text-sm text-destructive">
          {createMutation.error.message}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(routes.dashboard)}
        >
          Skip for Now
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
};
